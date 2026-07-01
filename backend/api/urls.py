from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'stocks', views.StockViewSet)
router.register(r'requests', views.StockRequestViewSet, basename='request')

urlpatterns = [
    # Authentication
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Blockchain
    path('blockchain/verify/', views.verify_blockchain_connection, name='blockchain-verify'),
    path('blockchain/logs/', views.get_blockchain_logs, name='blockchain-logs'),
    
    # Tracking
    path('my-requests/timeline/', views.my_requests_timeline, name='my-requests-timeline'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Router URLs
    path('', include(router.urls)),
]