from rest_framework import serializers
from .models import Booking
from apps.cars.serializers import CarSerializer
from apps.users.serializers import UserSerializer
from apps.users.models import User


class BookingSerializer(serializers.ModelSerializer):
    car_details = CarSerializer(source='car', read_only=True)
    client_details = UserSerializer(source='client', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = ('id', 'client', 'client_details', 'car', 'car_details',
                  'start_datetime', 'end_datetime', 'status', 'status_display',
                  'total_price', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'client', 'total_price', 'created_at', 'updated_at')


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('car', 'start_datetime', 'end_datetime', 'notes')

    def validate(self, attrs):
        request = self.context['request']

        # Только клиенты могут создавать бронирования
        if request.user.role != User.Role.CLIENT:
            raise serializers.ValidationError(
                'Создавать бронирования могут только клиенты.'
            )

        car = attrs.get('car')
        start = attrs.get('start_datetime')
        end = attrs.get('end_datetime')

        if start >= end:
            raise serializers.ValidationError('Дата начала должна быть раньше даты окончания.')

        if car.status != 'available':
            raise serializers.ValidationError('Автомобиль недоступен для бронирования.')

        overlapping = Booking.objects.filter(
            car=car,
            status__in=('pending', 'confirmed', 'active'),
            start_datetime__lt=end,
            end_datetime__gt=start,
        )
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)
        if overlapping.exists():
            raise serializers.ValidationError('Автомобиль уже забронирован на выбранное время.')

        return attrs

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('status', 'notes')
