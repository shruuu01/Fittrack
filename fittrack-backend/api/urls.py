from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, ProfileViewSet, FoodLogViewSet, WorkoutLogViewSet,
    RecommendationViewSet, PostureAnalysisViewSet, NotificationViewSet,
    SocialViewSet, AdminViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'profile', ProfileViewSet, basename='profile')
router.register(r'food', FoodLogViewSet, basename='food')
router.register(r'workout', WorkoutLogViewSet, basename='workout')
router.register(r'ai/recommendations', RecommendationViewSet, basename='recommendation')
router.register(r'posture', PostureAnalysisViewSet, basename='posture')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Base views
    path('', include(router.urls)),
    
    # Social mappings
    path('social/feed/', SocialViewSet.as_view({'get': 'feed'}), name='social-feed'),
    path('social/post/', SocialViewSet.as_view({'post': 'post_activity'}), name='social-post'),
    path('social/post/<int:pk>/comment/', SocialViewSet.as_view({'post': 'comment'}), name='social-comment'),
    path('social/post/<int:pk>/like/', SocialViewSet.as_view({'post': 'like'}), name='social-like'),
    path('social/friends/request/', SocialViewSet.as_view({'post': 'friend_request'}), name='friend-request'),
    path('social/friends/accept/', SocialViewSet.as_view({'post': 'accept_friend'}), name='friend-accept'),
    path('social/friends/suggestions/', SocialViewSet.as_view({'get': 'suggestions'}), name='friend-suggestions'),
    
    # Admin mappings
    path('admin-dashboard/stats/', AdminViewSet.as_view({'get': 'dashboard'}), name='admin-stats'),
    path('admin-dashboard/users/', AdminViewSet.as_view({'get': 'users'}), name='admin-users'),
    path('admin-dashboard/users/<int:pk>/role/', AdminViewSet.as_view({'put': 'change_role'}), name='admin-user-role'),
    path('admin-dashboard/reports/', AdminViewSet.as_view({'get': 'reports'}), name='admin-reports'),
    path('admin-dashboard/reports/<int:pk>/resolve/', AdminViewSet.as_view({'post': 'resolve_report'}), name='admin-resolve'),
]
