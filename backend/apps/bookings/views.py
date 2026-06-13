from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer, BookingStatusUpdateSerializer
from apps.users.permissions import IsManagerOrAdmin
from apps.users.models import User


class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.MANAGER, User.Role.ADMIN):
            return Booking.objects.select_related('client', 'car').all()
        return Booking.objects.select_related('client', 'car').filter(client=user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.MANAGER, User.Role.ADMIN):
            return Booking.objects.select_related('client', 'car').all()
        return Booking.objects.select_related('client', 'car').filter(client=user)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            user = self.request.user
            if user.role in (User.Role.MANAGER, User.Role.ADMIN):
                return BookingStatusUpdateSerializer
            return BookingCreateSerializer
        return BookingSerializer

    def destroy(self, request, *args, **kwargs):
        booking = self.get_object()
        user = request.user
        if booking.status in ('active', 'completed'):
            return Response({'detail': 'Нельзя отменить активное или завершённое бронирование.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if user.role not in (User.Role.MANAGER, User.Role.ADMIN) and booking.client != user:
            return Response({'detail': 'Нет доступа.'}, status=status.HTTP_403_FORBIDDEN)
        booking.status = 'cancelled'
        booking.save()
        return Response({'detail': 'Бронирование отменено.'}, status=status.HTTP_200_OK)


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Booking.objects.filter(client=self.request.user).select_related('car')
