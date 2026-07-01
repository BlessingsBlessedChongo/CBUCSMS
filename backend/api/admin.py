from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Stock, StockRequest, BlockchainLog, DamagedStockReport


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'department', 'is_active', 'wallet_address']
    list_filter = ['role', 'is_active', 'department']
    search_fields = ['username', 'email', 'department']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {
            'fields': ('role', 'department', 'phone', 'wallet_address')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Information', {
            'fields': ('role', 'department', 'phone', 'wallet_address')
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'current_quantity', 'min_threshold', 'status', 'location', 'updated_at']
    list_filter = ['status', 'category', 'location']
    search_fields = ['name', 'description']
    readonly_fields = ['status', 'created_at', 'updated_at']
    
    actions = ['mark_as_damaged']
    
    def mark_as_damaged(self, request, queryset):
        queryset.update(status='DAMAGED')
    mark_as_damaged.short_description = "Mark selected stock as damaged"


@admin.register(StockRequest)
class StockRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'requested_by', 'stock', 'quantity_requested', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'department', 'created_at']
    search_fields = ['requested_by__username', 'stock__name', 'department']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('requested_by', 'department', 'stock', 'quantity_requested', 'priority', 'reason')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Manager Approval', {
            'fields': ('manager_approved_by', 'manager_approved_at', 'manager_rejection_reason'),
            'classes': ('collapse',)
        }),
        ('Procurement Approval', {
            'fields': ('procurement_approved_by', 'procurement_approved_at', 'procurement_rejection_reason'),
            'classes': ('collapse',)
        }),
        ('CFO Approval', {
            'fields': ('cfo_approved_by', 'cfo_approved_at', 'cfo_rejection_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BlockchainLog)
class BlockchainLogAdmin(admin.ModelAdmin):
    list_display = ['stock_request', 'action', 'transaction_hash_short', 'block_number', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['transaction_hash', 'stock_request__id']
    readonly_fields = ['stock_request', 'user', 'action', 'transaction_hash', 'block_number', 'metadata', 'created_at']
    
    def transaction_hash_short(self, obj):
        return f"{obj.transaction_hash[:10]}...{obj.transaction_hash[-8:]}" if obj.transaction_hash else '-'
    transaction_hash_short.short_description = 'Transaction Hash'
    
    def has_add_permission(self, request):
        return False  # Logs should only be created programmatically


@admin.register(DamagedStockReport)
class DamagedStockReportAdmin(admin.ModelAdmin):
    list_display = ['stock', 'quantity_damaged', 'reported_by', 'reported_at', 'blockchain_tx_hash_short']
    list_filter = ['reported_at']
    search_fields = ['stock__name', 'reported_by__username']
    readonly_fields = ['reported_at']
    
    def blockchain_tx_hash_short(self, obj):
        if obj.blockchain_tx_hash:
            return f"{obj.blockchain_tx_hash[:10]}...{obj.blockchain_tx_hash[-8:]}"
        return '-'
    blockchain_tx_hash_short.short_description = 'Blockchain TX'