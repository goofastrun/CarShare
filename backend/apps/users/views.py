from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum
from .models import User
from .serializers import (
    RegisterSerializer, UserSerializer, UserUpdateSerializer, AdminUserSerializer
)
from .permissions import IsAdminRole, IsManagerOrAdmin


# ──────────────────────────────────────────────
# Аутентификация
# ──────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            return Response({'detail': 'Выход выполнен.'})
        except Exception:
            return Response({'detail': 'Ошибка.'}, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────────────────────────
# Профиль (любой авторизованный)
# ──────────────────────────────────────────────

class ProfileView(generics.RetrieveUpdateAPIView):
    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer


# ──────────────────────────────────────────────
# Управление пользователями (только админ)
# ──────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    """Список всех пользователей. Фильтрация по роли: ?role=client|manager|admin"""
    serializer_class = AdminUserSerializer
    permission_classes = (IsAdminRole,)

    def get_queryset(self):
        qs = User.objects.all().order_by('-created_at')
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')
        if role:
            qs = qs.filter(role=role)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Получить / изменить пользователя. Админ может менять role и is_active."""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = (IsAdminRole,)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        # Нельзя снять с себя роль admin или деактивировать себя
        if user.pk == request.user.pk:
            if 'role' in request.data and request.data['role'] != User.Role.ADMIN:
                return Response(
                    {'detail': 'Нельзя снять с себя роль администратора.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if 'is_active' in request.data and not request.data['is_active']:
                return Response(
                    {'detail': 'Нельзя заблокировать самого себя.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().update(request, *args, **kwargs)


class UserBlockView(APIView):
    """Быстрая блокировка / разблокировка пользователя."""
    permission_classes = (IsAdminRole,)

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Пользователь не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if user.pk == request.user.pk:
            return Response({'detail': 'Нельзя заблокировать самого себя.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = not user.is_active
        user.save()
        state = 'разблокирован' if user.is_active else 'заблокирован'
        return Response({'detail': f'Пользователь {state}.', 'is_active': user.is_active})


class UserChangeRoleView(APIView):
    """Сменить роль пользователя."""
    permission_classes = (IsAdminRole,)

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Пользователь не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if user.pk == request.user.pk:
            return Response({'detail': 'Нельзя менять роль себе.'}, status=status.HTTP_400_BAD_REQUEST)

        role = request.data.get('role')
        if role not in [r.value for r in User.Role]:
            return Response(
                {'detail': f'Недопустимая роль. Допустимые: {[r.value for r in User.Role]}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.role = role
        user.save()
        return Response({'detail': f'Роль изменена на {user.get_role_display()}.', 'role': user.role})


# ──────────────────────────────────────────────
# Статистика (только админ)
# ──────────────────────────────────────────────

class StatsView(APIView):
    permission_classes = (IsAdminRole,)

    def get(self, request):
        from apps.cars.models import Car
        from apps.bookings.models import Booking

        return Response({
            'users': {
                'total': User.objects.count(),
                'active': User.objects.filter(is_active=True).count(),
                'blocked': User.objects.filter(is_active=False).count(),
                'by_role': {
                    'client': User.objects.filter(role=User.Role.CLIENT).count(),
                    'manager': User.objects.filter(role=User.Role.MANAGER).count(),
                    'admin': User.objects.filter(role=User.Role.ADMIN).count(),
                },
            },
            'cars': {
                'total': Car.objects.count(),
                'by_status': {s: Car.objects.filter(status=s).count() for s, _ in Car.Status.choices},
            },
            'bookings': {
                'total': Booking.objects.count(),
                'by_status': {s: Booking.objects.filter(status=s).count() for s, _ in Booking.Status.choices},
            },
            'revenue': Booking.objects.filter(status='completed').aggregate(
                total=Sum('total_price')
            )['total'] or 0,
        })
