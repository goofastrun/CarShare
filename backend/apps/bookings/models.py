from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from apps.users.models import User
from apps.cars.models import Car


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает подтверждения'
        CONFIRMED = 'confirmed', 'Подтверждено'
        ACTIVE = 'active', 'Активно'
        COMPLETED = 'completed', 'Завершено'
        CANCELLED = 'cancelled', 'Отменено'

    client = models.ForeignKey(User, on_delete=models.CASCADE,
                               related_name='bookings', verbose_name='Клиент')
    car = models.ForeignKey(Car, on_delete=models.CASCADE,
                            related_name='bookings', verbose_name='Автомобиль')
    start_datetime = models.DateTimeField(verbose_name='Начало аренды')
    end_datetime = models.DateTimeField(verbose_name='Конец аренды')
    status = models.CharField(max_length=20, choices=Status.choices,
                               default=Status.PENDING, verbose_name='Статус')
    total_price = models.DecimalField(max_digits=10, decimal_places=2,
                                      null=True, blank=True, verbose_name='Сумма (руб.)')
    notes = models.TextField(blank=True, verbose_name='Примечания')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.pk} {self.client.email} — {self.car} ({self.get_status_display()})"

    def clean(self):
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError('Дата начала должна быть раньше даты окончания.')

    def calculate_price(self):
        if not self.start_datetime or not self.end_datetime:
            return None
        delta = self.end_datetime - self.start_datetime
        # Используем Decimal везде — price_per_hour и price_per_day уже Decimal в БД
        hours = Decimal(str(delta.total_seconds() / 3600))
        if hours >= 24:
            days = Decimal(str(delta.days))
            remaining_hours = hours - days * 24
            price = days * self.car.price_per_day + remaining_hours * self.car.price_per_hour
        else:
            price = hours * self.car.price_per_hour
        return round(price, 2)

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.calculate_price()
        super().save(*args, **kwargs)
