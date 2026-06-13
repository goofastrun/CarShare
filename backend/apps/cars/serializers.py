from rest_framework import serializers
from .models import Car
import datetime


class CarSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    transmission_display = serializers.CharField(source='get_transmission_display', read_only=True)
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)

    class Meta:
        model = Car
        fields = '__all__'

    def validate_price_per_hour(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Цена не может быть отрицательной.')
        return value

    def validate_price_per_day(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Цена не может быть отрицательной.')
        return value

    def validate_year(self, value):
        current_year = datetime.date.today().year
        if value < 1900 or value > current_year + 1:
            raise serializers.ValidationError(
                f'Год выпуска должен быть в диапазоне от 1900 до {current_year + 1}.'
            )
        return value

    def validate_seats(self, value):
        if value < 1 or value > 50:
            raise serializers.ValidationError('Количество мест должно быть от 1 до 50.')
        return value


class CarCreateUpdateSerializer(CarSerializer):
    class Meta:
        model = Car
        fields = ('brand', 'model', 'year', 'license_plate', 'color', 'transmission',
                  'fuel_type', 'seats', 'price_per_hour', 'price_per_day', 'status',
                  'location', 'mileage', 'description', 'image')
