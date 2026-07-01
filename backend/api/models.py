from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """
    Custom User model with role-based access control.
    Matches the roles defined in the CBU project report.
    """
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('PROCUREMENT', 'Procurement Officer'),
        ('MANAGER', 'Stores Manager'),
        ('CFO', 'Chief Financial Officer'),
        ('STOREKEEPER', 'Storekeeper'),
        ('DEPARTMENT', 'Department Staff (Dean/HOD)'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DEPARTMENT')
    department = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Blockchain wallet address for this user (for signing transactions)
    wallet_address = models.CharField(max_length=42, blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_procurement(self):
        return self.role == 'PROCUREMENT'
    
    @property
    def is_manager(self):
        return self.role == 'MANAGER'
    
    @property
    def is_cfo(self):
        return self.role == 'CFO'
    
    @property
    def is_storekeeper(self):
        return self.role == 'STOREKEEPER'


class Category(models.Model):
    """Stock categories for organizing inventory."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return self.name


class Stock(models.Model):
    """
    Inventory items stored in the central stores.
    """
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('LOW_STOCK', 'Low Stock'),
        ('OUT_OF_STOCK', 'Out of Stock'),
        ('DAMAGED', 'Damaged'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='stocks')
    
    # Quantities
    original_quantity = models.IntegerField(default=0)
    current_quantity = models.IntegerField(default=0)
    min_threshold = models.IntegerField(default=10)
    
    # Location
    location = models.CharField(max_length=100, blank=True, null=True)
    
    # Pricing
    cost_per_item = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Who added/updated
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stocks_created')
    
    class Meta:
        verbose_name_plural = "Stocks"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.current_quantity} units)"
    
    def update_status(self):
        """Automatically update status based on quantity."""
        if self.current_quantity <= 0:
            self.status = 'OUT_OF_STOCK'
        elif self.current_quantity <= self.min_threshold:
            self.status = 'LOW_STOCK'
        else:
            self.status = 'AVAILABLE'
        self.save()
    
    def save(self, *args, **kwargs):
        if self.current_quantity <= 0:
            self.status = 'OUT_OF_STOCK'
        elif self.current_quantity <= self.min_threshold:
            self.status = 'LOW_STOCK'
        else:
            self.status = 'AVAILABLE'
        super().save(*args, **kwargs)


class StockRequest(models.Model):
    """
    Requests submitted by departments for stock items.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Manager Approval'),
        ('MANAGER_APPROVED', 'Manager Approved'),
        ('MANAGER_REJECTED', 'Manager Rejected'),
        ('PROCUREMENT_APPROVED', 'Procurement Approved'),
        ('PROCUREMENT_REJECTED', 'Procurement Rejected'),
        ('CFO_APPROVED', 'CFO Approved (Fully Approved)'),
        ('CFO_REJECTED', 'CFO Rejected'),
        ('FULFILLED', 'Fulfilled'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    # Requester info
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_made')
    department = models.CharField(max_length=100)
    
    # Item requested
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='requests')
    quantity_requested = models.IntegerField()
    
    # Priority
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    reason = models.TextField(blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='PENDING')
    
    # Approval tracking
    manager_approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='manager_approvals')
    manager_approved_at = models.DateTimeField(null=True, blank=True)
    manager_rejection_reason = models.TextField(blank=True, null=True)
    
    procurement_approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='procurement_approvals')
    procurement_approved_at = models.DateTimeField(null=True, blank=True)
    procurement_rejection_reason = models.TextField(blank=True, null=True)
    
    cfo_approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cfo_approvals')
    cfo_approved_at = models.DateTimeField(null=True, blank=True)
    cfo_rejection_reason = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Request #{self.id} - {self.stock.name} ({self.quantity_requested}) - {self.status}"
    
    @property
    def is_fully_approved(self):
        return self.status == 'CFO_APPROVED'
    
    @property
    def is_rejected(self):
        return self.status in ['MANAGER_REJECTED', 'PROCUREMENT_REJECTED', 'CFO_REJECTED']


class BlockchainLog(models.Model):
    """
    Maps Django requests to blockchain transactions.
    Provides audit trail linking off-chain data to on-chain proofs.
    """
    ACTION_CHOICES = [
        ('REQUEST_CREATED', 'Request Created'),
        ('MANAGER_APPROVED', 'Manager Approved'),
        ('PROCUREMENT_APPROVED', 'Procurement Approved'),
        ('CFO_APPROVED', 'CFO Approved'),
        ('REQUEST_FINALIZED', 'Request Finalized'),
    ]
    
    # Link to Django models
    stock_request = models.ForeignKey(StockRequest, on_delete=models.CASCADE, related_name='blockchain_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Blockchain transaction details
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    transaction_hash = models.CharField(max_length=66, unique=True)  # 0x + 64 hex chars
    block_number = models.IntegerField()
    
    # Additional data (JSON field for flexibility)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_hash']),
            models.Index(fields=['stock_request']),
        ]
    
    def __str__(self):
        return f"{self.action} - Request #{self.stock_request.id} - Block {self.block_number}"


class DamagedStockReport(models.Model):
    """
    Reports of damaged or unusable stock items.
    """
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='damage_reports')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    quantity_damaged = models.IntegerField()
    reason = models.TextField()
    reported_at = models.DateTimeField(auto_now_add=True)
    
    # Blockchain tracking
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    
    def __str__(self):
        return f"Damage Report: {self.stock.name} - {self.quantity_damaged} units"
    
    def save(self, *args, **kwargs):
        # Reduce stock quantity when damage is reported
        if not self.pk:  # Only on creation
            self.stock.current_quantity -= self.quantity_damaged
            self.stock.save()
        super().save(*args, **kwargs)