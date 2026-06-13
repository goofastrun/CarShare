from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    UserListView, UserDetailView, UserBlockView, UserChangeRoleView, StatsView,
)

urlpatterns = [
    # Аутентификация
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Профиль
    path('profile/', ProfileView.as_view(), name='profile'),

    # Управление пользователями (только админ)
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/block/', UserBlockView.as_view(), name='user-block'),
    path('users/<int:pk>/role/', UserChangeRoleView.as_view(), name='user-change-role'),

    # Статистика (только админ)
    path('stats/', StatsView.as_view(), name='stats'),
]
