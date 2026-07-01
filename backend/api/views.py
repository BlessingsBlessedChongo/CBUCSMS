import logging

from rest_framework import viewsets, status, generics, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import F, Count, Q

logger = logging.getLogger(__name__)

from .models import User, Category, Stock, StockRequest, BlockchainLog
from .serializers import (
    UserSerializer, LoginSerializer, CategorySerializer,
    StockSerializer, StockRequestSerializer, BlockchainLogSerializer
)
from .blockchain_service import BlockchainService


# ============================================
# AUTHENTICATION VIEWS
# ============================================

class LoginView(generics.GenericAPIView):
    """Login and return JWT tokens."""
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'department': user.department,
                'wallet_address': user.wallet_address,
            }
        })


class LogoutView(generics.GenericAPIView):
    """Logout view (token blacklisting disabled)."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ============================================
# USER VIEWSET
# ============================================

class UserViewSet(viewsets.ModelViewSet):
    """Manage users (Admin only for create/update/delete)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        user = serializer.save()
        user.wallet_address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
        user.save()


# ============================================
# CATEGORY VIEWSET
# ============================================

class CategoryViewSet(viewsets.ModelViewSet):
    """Manage stock categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


# ============================================
# STOCK VIEWSET
# ============================================

class StockViewSet(viewsets.ModelViewSet):
    """Manage inventory stock items."""
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role not in ['STOREKEEPER', 'MANAGER', 'ADMIN']:
            raise serializers.ValidationError('Only Storekeeper, Manager, or Admin can create stock items')

        with transaction.atomic():
            stock = serializer.save(created_by=self.request.user)
            try:
                blockchain = BlockchainService()
                blockchain.log_stock_operation(
                    operation_type='CREATED',
                    stock_id=stock.id,
                    quantity=stock.original_quantity,
                    reason=f"Stock item '{stock.name}' created"
                )
            except Exception as exc:
                logger.exception('Blockchain logging failed during stock creation')
            return stock
    
    @action(detail=True, methods=['post'])
    def update_quantity(self, request, pk=None):
        """Update stock quantity (Storekeeper/Manager only)."""
        if request.user.role not in ['STOREKEEPER', 'MANAGER', 'ADMIN']:
            return Response(
                {'error': 'Only Storekeeper, Manager, or Admin can update stock'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stock = self.get_object()
        new_quantity = request.data.get('quantity')
        reason = request.data.get('reason', 'Manual update')
        
        if new_quantity is None:
            return Response({'error': 'Quantity required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_quantity = int(new_quantity)
            if new_quantity < 0:
                return Response(
                    {'error': 'Quantity cannot be negative'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            old_quantity = stock.current_quantity
            quantity_change = new_quantity - old_quantity
            
            stock.current_quantity = new_quantity
            stock.save()
            
            blockchain = BlockchainService()
            operation_type = 'CONSUMED' if quantity_change < 0 else 'ADJUSTED'
            blockchain.log_stock_operation(
                operation_type=operation_type,
                stock_id=stock.id,
                quantity=abs(quantity_change),
                reason=reason
            )
            
            return Response({
                'message': 'Stock updated',
                'old_quantity': old_quantity,
                'new_quantity': stock.current_quantity,
                'quantity_change': quantity_change,
                'status': stock.status
            })
        except (ValueError, TypeError):
            return Response(
                {'error': 'Quantity must be a valid integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items below minimum threshold."""
        low_items = Stock.objects.filter(current_quantity__lte=F('min_threshold'))
        serializer = self.get_serializer(low_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_fulfilled(self, request, pk=None):
        """Storekeeper marks a request as fulfilled (items released)."""
        if request.user.role not in ['STOREKEEPER', 'ADMIN']:
            return Response(
                {'error': 'Only Storekeeper can mark requests as fulfilled'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stock = self.get_object()
        request_id = request.data.get('request_id')
        
        if not request_id:
            return Response({'error': 'request_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            stock_request = StockRequest.objects.get(id=request_id)
            if stock_request.status != 'CFO_APPROVED':
                return Response(
                    {'error': 'Only CFO approved requests can be fulfilled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            stock_request.status = 'FULFILLED'
            stock_request.save()
            
            # Log to blockchain
            blockchain = BlockchainService()
            blockchain.log_stock_operation(
                operation_type='CONSUMED',
                stock_id=stock.id,
                quantity=stock_request.quantity_requested,
                reason=f"Request #{request_id} fulfilled by {request.user.username}"
            )
            
            return Response({
                'message': 'Request marked as fulfilled',
                'request_id': request_id,
                'status': 'FULFILLED'
            })
        except StockRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)


# ============================================
# STOCK REQUEST VIEWSET (WITH BLOCKCHAIN)
# ============================================

class StockRequestViewSet(viewsets.ModelViewSet):
    """Manage stock requests with blockchain integration."""
    queryset = StockRequest.objects.all()
    serializer_class = StockRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = StockRequest.objects.select_related('requested_by', 'stock')
        
        # Department staff see only their requests
        if user.role == 'DEPARTMENT':
            return queryset.filter(requested_by=user)
        # Storekeeper sees approved requests (ready to fulfill)
        elif user.role == 'STOREKEEPER':
            return queryset.filter(status__in=['CFO_APPROVED', 'FULFILLED'])
        # Everyone else sees all requests
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                stock_request = self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                response_data = self.get_serializer(stock_request).data
                return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
        except serializers.ValidationError:
            raise
        except Exception as exc:
            logger.exception('Stock request creation failed')
            raise serializers.ValidationError({'detail': f'Unable to submit stock request. {str(exc)}'})

    def perform_create(self, serializer):
        """Create request and log to blockchain."""
        department = self.request.data.get('department') or self.request.user.department or 'General'

        try:
            stock_request = serializer.save(
                requested_by=self.request.user,
                department=department,
                status='PENDING'
            )
        except Exception as exc:
            logger.exception('Failed to save stock request')
            raise serializers.ValidationError({'request': 'Unable to create stock request.'})

        blockchain = BlockchainService()

        manager = User.objects.filter(role='MANAGER').first()
        procurement = User.objects.filter(role='PROCUREMENT').first()
        cfo = User.objects.filter(role='CFO').first()

        manager_addr = manager.wallet_address if manager else blockchain.account_address
        procurement_addr = procurement.wallet_address if procurement else blockchain.account_address
        cfo_addr = cfo.wallet_address if cfo else blockchain.account_address

        try:
            result = blockchain.create_request_on_chain(
                request_id=stock_request.id,
                manager_addr=manager_addr,
                procurement_addr=procurement_addr,
                cfo_addr=cfo_addr
            )
        except Exception as exc:
            logger.exception('Blockchain request creation failed')
            raise serializers.ValidationError({
                'blockchain': f'Blockchain request creation failed: {str(exc)}'
            })

        if not result.get('success', False):
            raise serializers.ValidationError({
                'blockchain': result.get('error', 'Unknown blockchain failure')
            })

        try:
            BlockchainLog.objects.create(
                stock_request=stock_request,
                user=self.request.user,
                action='REQUEST_CREATED',
                transaction_hash=result['transaction_hash'],
                block_number=result['block_number']
            )
        except Exception as exc:
            logger.exception('Failed to log blockchain request creation')

        return stock_request
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a request (role-based sequential approval)."""
        stock_request = self.get_object()
        user = request.user
        rejection_reason = request.data.get('rejection_reason')
        action_type = request.data.get('action', 'approve')
        
        if user.role == 'MANAGER':
            if stock_request.status != 'PENDING':
                return Response(
                    {'error': f'Manager can only approve PENDING requests. Current status: {stock_request.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if action_type == 'reject' and not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return self._approve_as_manager(stock_request, user, rejection_reason if action_type == 'reject' else None)
        
        elif user.role == 'PROCUREMENT':
            if stock_request.status != 'MANAGER_APPROVED':
                return Response(
                    {'error': f'Procurement can only approve MANAGER_APPROVED requests. Current status: {stock_request.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if action_type == 'reject' and not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return self._approve_as_procurement(stock_request, user, rejection_reason if action_type == 'reject' else None)
        
        elif user.role == 'CFO':
            if stock_request.status != 'PROCUREMENT_APPROVED':
                return Response(
                    {'error': f'CFO can only approve PROCUREMENT_APPROVED requests. Current status: {stock_request.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if action_type == 'reject' and not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return self._approve_as_cfo(stock_request, user, rejection_reason if action_type == 'reject' else None)
        
        return Response(
            {'error': f'User role {user.role} is not authorized to approve requests'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def _approve_as_manager(self, stock_request, user, rejection_reason):
        blockchain = BlockchainService()
        result = blockchain.approve_as_manager(stock_request.id)
        
        if result['success']:
            if rejection_reason:
                stock_request.status = 'MANAGER_REJECTED'
                stock_request.manager_rejection_reason = rejection_reason
            else:
                stock_request.status = 'MANAGER_APPROVED'
            
            stock_request.manager_approved_by = user
            stock_request.manager_approved_at = timezone.now()
            stock_request.save()
            
            BlockchainLog.objects.create(
                stock_request=stock_request,
                user=user,
                action='MANAGER_APPROVED',
                transaction_hash=result['transaction_hash'],
                block_number=result['block_number'],
                metadata={'rejection_reason': rejection_reason} if rejection_reason else {}
            )
            
            return Response({
                'message': 'Manager approval/rejection recorded',
                'tx_hash': result['transaction_hash'],
                'status': stock_request.status
            })
        
        return Response({'error': result.get('error')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _approve_as_procurement(self, stock_request, user, rejection_reason):
        blockchain = BlockchainService()
        result = blockchain.approve_as_procurement(stock_request.id)
        
        if result['success']:
            if rejection_reason:
                stock_request.status = 'PROCUREMENT_REJECTED'
                stock_request.procurement_rejection_reason = rejection_reason
            else:
                stock_request.status = 'PROCUREMENT_APPROVED'
            
            stock_request.procurement_approved_by = user
            stock_request.procurement_approved_at = timezone.now()
            stock_request.save()
            
            BlockchainLog.objects.create(
                stock_request=stock_request,
                user=user,
                action='PROCUREMENT_APPROVED',
                transaction_hash=result['transaction_hash'],
                block_number=result['block_number'],
                metadata={'rejection_reason': rejection_reason} if rejection_reason else {}
            )
            
            return Response({
                'message': 'Procurement approval/rejection recorded',
                'tx_hash': result['transaction_hash'],
                'status': stock_request.status
            })
        
        return Response({'error': result.get('error')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _approve_as_cfo(self, stock_request, user, rejection_reason):
        blockchain = BlockchainService()
        result = blockchain.approve_as_cfo(stock_request.id)
        
        if result['success']:
            stock_request.status = 'CFO_APPROVED' if not rejection_reason else 'CFO_REJECTED'
            stock_request.cfo_approved_by = user
            stock_request.cfo_approved_at = timezone.now()
            stock_request.cfo_rejection_reason = rejection_reason
            stock_request.save()
            
            BlockchainLog.objects.create(
                stock_request=stock_request,
                user=user,
                action='CFO_APPROVED',
                transaction_hash=result['transaction_hash'],
                block_number=result['block_number']
            )
            
            if not rejection_reason:
                stock = stock_request.stock
                old_quantity = stock.current_quantity
                stock.current_quantity -= stock_request.quantity_requested
                stock.save()
                
                blockchain.log_stock_operation(
                    operation_type='CONSUMED',
                    stock_id=stock.id,
                    quantity=stock_request.quantity_requested,
                    reason=f"Approved request #{stock_request.id} for {stock_request.department}"
                )
            
            return Response({
                'message': 'CFO approval recorded',
                'tx_hash': result['transaction_hash'],
                'status': stock_request.status
            })
        
        return Response({'error': result.get('error')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def blockchain_status(self, request, pk=None):
        """Get blockchain verification status for a request."""
        stock_request = self.get_object()
        blockchain = BlockchainService()
        result = blockchain.get_request_status(stock_request.id)
        
        logs = BlockchainLog.objects.filter(stock_request=stock_request)
        serializer = BlockchainLogSerializer(logs, many=True)
        
        return Response({
            'django_status': stock_request.status,
            'blockchain_status': result,
            'transaction_logs': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get requests pending approval for current user's role."""
        user = request.user
        
        queryset = StockRequest.objects.select_related('requested_by', 'stock')
        if user.role == 'MANAGER':
            queryset = queryset.filter(status='PENDING')
        elif user.role == 'PROCUREMENT':
            queryset = queryset.filter(status='MANAGER_APPROVED')
        elif user.role == 'CFO':
            queryset = queryset.filter(status='PROCUREMENT_APPROVED')
        else:
            queryset = queryset.none()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Department/Dean view: Get all my requests with full tracking."""
        user = request.user
        
        if user.role == 'STOREKEEPER':
            queryset = StockRequest.objects.filter(
                status__in=['CFO_APPROVED', 'FULFILLED']
            ).select_related('stock', 'requested_by').order_by('-created_at')
        else:
            queryset = StockRequest.objects.filter(
                requested_by=user
            ).select_related('stock').order_by('-created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ============================================
# BLOCKCHAIN VERIFICATION VIEWS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_blockchain_connection(request):
    """Test endpoint to verify blockchain connectivity."""
    blockchain = BlockchainService()
    diagnostics = blockchain.verify_connection()
    return Response(diagnostics)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blockchain_logs(request):
    """Get blockchain transaction logs filtered by user role."""
    user = request.user
    
    logs = BlockchainLog.objects.select_related('stock_request', 'user').all()
    
    # Role-based filtering
    if user.role == 'DEPARTMENT':
        logs = logs.filter(stock_request__requested_by=user)
    elif user.role == 'STOREKEEPER':
        logs = logs.filter(
            stock_request__status__in=['CFO_APPROVED', 'FULFILLED']
        )
    elif user.role in ['MANAGER', 'PROCUREMENT', 'CFO', 'ADMIN']:
        pass
    else:
        logs = logs.none()
    
    logs = logs.order_by('-created_at')[:50]
    serializer = BlockchainLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_requests_timeline(request):
    """
    Department/Dean/Storekeeper view: Track requests with blockchain verification.
    """
    user = request.user
    
    if user.role not in ['DEPARTMENT', 'STOREKEEPER', 'ADMIN']:
        return Response(
            {'error': 'This endpoint is for tracking requests'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if user.role == 'STOREKEEPER':
        requests_queryset = StockRequest.objects.filter(
            status__in=['CFO_APPROVED', 'FULFILLED']
        ).select_related('stock', 'requested_by')
    else:
        requests_queryset = StockRequest.objects.filter(
            requested_by=user
        ).select_related('stock')
    
    timeline = []
    blockchain = BlockchainService()
    
    for req in requests_queryset.order_by('-created_at')[:20]:
        blockchain_status = blockchain.get_request_status(req.id)
        
        timeline.append({
            'request_id': req.id,
            'stock_name': req.stock.name,
            'quantity': req.quantity_requested,
            'priority': req.priority,
            'django_status': req.status,
            'created_at': req.created_at,
            'blockchain_verified': blockchain_status.get('success', False),
            'approval_steps': {
                'manager': {
                    'approved': req.manager_approved_by is not None,
                    'approved_by': req.manager_approved_by.username if req.manager_approved_by else None,
                    'approved_at': req.manager_approved_at,
                    'rejection_reason': req.manager_rejection_reason
                },
                'procurement': {
                    'approved': req.procurement_approved_by is not None,
                    'approved_by': req.procurement_approved_by.username if req.procurement_approved_by else None,
                    'approved_at': req.procurement_approved_at,
                    'rejection_reason': req.procurement_rejection_reason
                },
                'cfo': {
                    'approved': req.cfo_approved_by is not None,
                    'approved_by': req.cfo_approved_by.username if req.cfo_approved_by else None,
                    'approved_at': req.cfo_approved_at,
                    'rejection_reason': req.cfo_rejection_reason
                }
            },
            'blockchain_data': blockchain_status if blockchain_status.get('success') else None
        })
    
    return Response({
        'user_role': user.role,
        'total_requests': len(timeline),
        'timeline': timeline
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get comprehensive dashboard statistics with role-based filtering."""
    user = request.user

    # Base querysets with role filtering
    if user.role == 'DEPARTMENT':
        stocks_queryset = Stock.objects.all()
        requests_queryset = StockRequest.objects.filter(requested_by=user)
    elif user.role == 'STOREKEEPER':
        stocks_queryset = Stock.objects.all()
        requests_queryset = StockRequest.objects.filter(status__in=['CFO_APPROVED', 'FULFILLED'])
    else:
        stocks_queryset = Stock.objects.all()
        requests_queryset = StockRequest.objects.all()

    total_stocks = stocks_queryset.count()
    low_stock_count = stocks_queryset.filter(current_quantity__lte=F('min_threshold')).count()
    out_of_stock_count = stocks_queryset.filter(current_quantity=0).count()

    total_requests = requests_queryset.count()
    pending_requests = requests_queryset.filter(status='PENDING').count()
    approved_requests = requests_queryset.filter(status__in=['CFO_APPROVED', 'FULFILLED']).count()
    rejected_requests = requests_queryset.filter(
        status__in=['MANAGER_REJECTED', 'PROCUREMENT_REJECTED', 'CFO_REJECTED']
    ).count()

    pending_for_user = 0
    if user.role == 'MANAGER':
        pending_for_user = StockRequest.objects.filter(status='PENDING').count()
    elif user.role == 'PROCUREMENT':
        pending_for_user = StockRequest.objects.filter(status='MANAGER_APPROVED').count()
    elif user.role == 'CFO':
        pending_for_user = StockRequest.objects.filter(status='PROCUREMENT_APPROVED').count()
    elif user.role == 'STOREKEEPER':
        pending_for_user = StockRequest.objects.filter(status='CFO_APPROVED').count()

    blockchain_logs_count = BlockchainLog.objects.count()
    recent_blocks = BlockchainLog.objects.order_by('-block_number').first()
    latest_block = recent_blocks.block_number if recent_blocks else 0

    # Monthly trends (last 6 months)
    monthly_trends = []
    for i in range(5, -1, -1):
        month_start = timezone.now().replace(day=1) - timezone.timedelta(days=i*30)
        month_end = (month_start.replace(day=28) + timezone.timedelta(days=4)).replace(day=1) - timezone.timedelta(days=1)
        
        count = requests_queryset.filter(
            created_at__gte=month_start,
            created_at__lte=month_end
        ).count()
        
        monthly_trends.append({
            'month': month_start.strftime('%b %Y'),
            'requests': count
        })

    category_distribution = list(
        Stock.objects.values('category__name')
        .annotate(count=Count('id'))
        .order_by('-count')
        .values('category__name', 'count')
    )

    top_requested_items = list(
        StockRequest.objects.values('stock__name')
        .annotate(request_count=Count('id'))
        .order_by('-request_count')[:5]
        .values('stock__name', 'request_count')
    )

    return Response({
        'overview': {
            'total_stocks': total_stocks,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'approved_requests': approved_requests,
            'rejected_requests': rejected_requests,
            'pending_for_user': pending_for_user,
            'blockchain_logs_count': blockchain_logs_count,
            'latest_block': latest_block
        },
        'charts': {
            'monthly_trends': monthly_trends,
            'category_distribution': [
                {'name': item['category__name'] or 'Uncategorized', 'count': item['count']}
                for item in category_distribution
            ],
            'top_requested_items': [
                {'name': item['stock__name'], 'request_count': item['request_count']}
                for item in top_requested_items
            ]
        }
    })