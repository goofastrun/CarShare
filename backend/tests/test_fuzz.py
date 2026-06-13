"""
Фаззинг-тестирование системы каршеринга.
Проверяет устойчивость сериализаторов к некорректным входным данным
без обращения к базе данных.
"""
import pytest
from hypothesis import given, settings, strategies as st
from hypothesis import HealthCheck


# ──────────────────────────────────────────────
# 1. Недопустимые роли пользователей
# ──────────────────────────────────────────────

VALID_ROLES = {'client', 'manager', 'admin'}

@given(role=st.text(min_size=1, max_size=30))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_invalid_roles_rejected(role):
    """Недопустимые роли должны отклоняться валидатором."""
    from rest_framework.serializers import ChoiceField
    from apps.users.models import User

    if role in VALID_ROLES:
        return

    field = ChoiceField(choices=User.Role.choices)
    field.run_validation.__func__  # проверяем что поле существует

    from rest_framework.exceptions import ValidationError
    try:
        field.run_validation(role)
        assert False, f'Роль «{role}» должна быть отклонена'
    except ValidationError:
        pass


# ──────────────────────────────────────────────
# 2. Клиент без водительского удостоверения
# ──────────────────────────────────────────────

@given(driver_license=st.one_of(st.just(''), st.just(None)))
@settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
def test_client_without_driver_license_rejected(driver_license):
    """Клиент без водительского удостоверения не должен проходить валидацию."""
    from apps.users.serializers import RegisterSerializer

    data = {
        'email': 'uniqueclient@fuzz.test',
        'username': 'fuzz_client',
        'password': 'StrongPass123!',
        'password2': 'StrongPass123!',
        'role': 'client',
        'phone': '+79001234567',
        'driver_license': driver_license or '',
    }
    # Убираем UniqueValidator с полей перед тестом
    serializer = RegisterSerializer(data=data)
    serializer.fields['email'].validators = []
    serializer.fields['username'].validators = []

    assert not serializer.is_valid(), (
        'Клиент без водительского удостоверения должен быть отклонён'
    )


# ──────────────────────────────────────────────
# 3. Несовпадающие пароли
# ──────────────────────────────────────────────

@given(
    password=st.text(min_size=8, max_size=20),
    password2=st.text(min_size=8, max_size=20),
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_mismatched_passwords_rejected(password, password2):
    """Несовпадающие пароли должны отклоняться."""
    if password == password2:
        return

    from apps.users.serializers import RegisterSerializer

    data = {
        'email': 'fuzz@fuzz.test',
        'username': 'fuzzuser',
        'password': password,
        'password2': password2,
        'role': 'client',
        'driver_license': '77АА123456',
    }
    serializer = RegisterSerializer(data=data)
    serializer.fields['email'].validators = []
    serializer.fields['username'].validators = []

    assert not serializer.is_valid(), (
        f'Несовпадающие пароли должны отклоняться'
    )


# ──────────────────────────────────────────────
# 4. Некорректный email
# ──────────────────────────────────────────────

@given(email=st.text(min_size=1, max_size=50).filter(lambda x: '@' not in x))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_invalid_email_rejected(email):
    """Строки без @ не должны приниматься как email."""
    from rest_framework.fields import EmailField
    from rest_framework.exceptions import ValidationError

    field = EmailField()
    try:
        field.run_validation(email)
        assert False, f'Некорректный email «{email}» не должен быть принят'
    except ValidationError:
        pass


# ──────────────────────────────────────────────
# 5. Отрицательные цены на автомобиль
# ──────────────────────────────────────────────

@given(price=st.floats(max_value=-0.01, allow_nan=False, allow_infinity=False))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_negative_car_price_rejected(price):
    """Отрицательная стоимость аренды должна отклоняться."""
    from apps.cars.serializers import CarSerializer

    data = {
        'brand': 'Toyota',
        'model': 'Camry',
        'year': 2020,
        'license_plate': 'Б999ББ99',
        'color': 'Белый',
        'transmission': 'auto',
        'fuel_type': 'petrol',
        'seats': 5,
        'price_per_hour': str(price),
        'price_per_day': '2500.00',
        'status': 'available',
        'location': 'Москва',
    }
    serializer = CarSerializer(data=data)
    serializer.fields['license_plate'].validators = []

    assert not serializer.is_valid(), (
        f'Отрицательная цена {price} должна быть отклонена'
    )


# ──────────────────────────────────────────────
# 6. Недопустимый статус автомобиля
# ──────────────────────────────────────────────

VALID_CAR_STATUSES = {'available', 'booked', 'maintenance', 'unavailable'}

@given(status=st.text(min_size=1, max_size=30))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_invalid_car_status_rejected(status):
    """Недопустимый статус автомобиля должен отклоняться."""
    from rest_framework.serializers import ChoiceField
    from apps.cars.models import Car
    from rest_framework.exceptions import ValidationError

    if status in VALID_CAR_STATUSES:
        return

    field = ChoiceField(choices=Car.Status.choices)
    try:
        field.run_validation(status)
        assert False, f'Статус «{status}» должен быть отклонён'
    except ValidationError:
        pass


# ──────────────────────────────────────────────
# 7. Некорректный год выпуска автомобиля
# ──────────────────────────────────────────────

@given(year=st.one_of(
    st.integers(max_value=0),
    st.integers(min_value=2100),
))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_invalid_car_year_rejected(year):
    """Год выпуска вне допустимого диапазона должен отклоняться."""
    from apps.cars.serializers import CarSerializer

    data = {
        'brand': 'Toyota',
        'model': 'Camry',
        'year': year,
        'license_plate': 'В888ВВ88',
        'color': 'Белый',
        'transmission': 'auto',
        'fuel_type': 'petrol',
        'seats': 5,
        'price_per_hour': '350.00',
        'price_per_day': '2500.00',
        'status': 'available',
        'location': 'Москва',
    }
    serializer = CarSerializer(data=data)
    serializer.fields['license_plate'].validators = []

    assert not serializer.is_valid(), (
        f'Год выпуска {year} должен быть отклонён'
    )


# ──────────────────────────────────────────────
# 8. Недопустимый статус бронирования
# ──────────────────────────────────────────────

VALID_BOOKING_STATUSES = {'pending', 'confirmed', 'active', 'completed', 'cancelled'}

@given(status=st.text(min_size=1, max_size=30))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_invalid_booking_status_rejected(status):
    """Недопустимый статус бронирования должен отклоняться."""
    from rest_framework.serializers import ChoiceField
    from apps.bookings.models import Booking
    from rest_framework.exceptions import ValidationError

    if status in VALID_BOOKING_STATUSES:
        return

    field = ChoiceField(choices=Booking.Status.choices)
    try:
        field.run_validation(status)
        assert False, f'Статус «{status}» должен быть отклонён'
    except ValidationError:
        pass
