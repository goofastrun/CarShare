from rest_framework.permissions import BasePermission
from .models import User


class IsAdminRole(BasePermission):
    """Только администратор."""
    message = 'Доступ только для администраторов.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )


class IsManagerOrAdmin(BasePermission):
    """Менеджер или администратор."""
    message = 'Доступ только для менеджеров и администраторов.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in (User.Role.MANAGER, User.Role.ADMIN)
        )


class IsOwnerOrManagerOrAdmin(BasePermission):
    """Владелец объекта, менеджер или администратор."""
    message = 'Нет доступа к этому объекту.'

    def has_object_permission(self, request, view, obj):
        if request.user.role in (User.Role.MANAGER, User.Role.ADMIN):
            return True
        # Для бронирований — проверяем client
        if hasattr(obj, 'client'):
            return obj.client == request.user
        return False
