from django.db import models


class Car(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Доступна'
        BOOKED = 'booked', 'Забронирована'
        MAINTENANCE = 'maintenance', 'На обслуживании'
        UNAVAILABLE = 'unavailable', 'Недоступна'

    class Transmission(models.TextChoices):
        AUTO = 'auto', 'Автомат'
        MANUAL = 'manual', 'Механика'

    class FuelType(models.TextChoices):
        PETROL = 'petrol', 'Бензин'
        DIESEL = 'diesel', 'Дизель'
        ELECTRIC = 'electric', 'Электро'
        HYBRID = 'hybrid', 'Гибрид'

    brand = models.CharField(max_length=100, verbose_name='Марка')
    model = models.CharField(max_length=100, verbose_name='Модель')
    year = models.PositiveIntegerField(verbose_name='Год выпуска')
    license_plate = models.CharField(max_length=20, unique=True, verbose_name='Гос. номер')
    color = models.CharField(max_length=50, verbose_name='Цвет')
    transmission = models.CharField(max_length=10, choices=Transmission.choices,
                                    default=Transmission.AUTO, verbose_name='Коробка передач')
    fuel_type = models.CharField(max_length=10, choices=FuelType.choices,
                                 default=FuelType.PETROL, verbose_name='Тип топлива')
    seats = models.PositiveIntegerField(default=5, verbose_name='Мест')
    price_per_hour = models.DecimalField(max_digits=8, decimal_places=2,
                                         verbose_name='Цена в час (руб.)')
    price_per_day = models.DecimalField(max_digits=8, decimal_places=2,
                                        verbose_name='Цена в день (руб.)')
    status = models.CharField(max_length=20, choices=Status.choices,
                               default=Status.AVAILABLE, verbose_name='Статус')
    location = models.CharField(max_length=255, verbose_name='Местонахождение')
    mileage = models.PositiveIntegerField(default=0, verbose_name='Пробег (км)')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(upload_to='cars/', blank=True, null=True, verbose_name='Фото')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Автомобиль'
        verbose_name_plural = 'Автомобили'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.brand} {self.model} ({self.license_plate})"
