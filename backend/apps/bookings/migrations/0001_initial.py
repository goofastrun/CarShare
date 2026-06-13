from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cars', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_datetime', models.DateTimeField(verbose_name='Начало аренды')),
                ('end_datetime', models.DateTimeField(verbose_name='Конец аренды')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Ожидает подтверждения'),
                        ('confirmed', 'Подтверждено'),
                        ('active', 'Активно'),
                        ('completed', 'Завершено'),
                        ('cancelled', 'Отменено'),
                    ],
                    default='pending',
                    max_length=20,
                    verbose_name='Статус',
                )),
                ('total_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Сумма (руб.)')),
                ('notes', models.TextField(blank=True, verbose_name='Примечания')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='bookings',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Клиент',
                )),
                ('car', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='bookings',
                    to='cars.car',
                    verbose_name='Автомобиль',
                )),
            ],
            options={
                'verbose_name': 'Бронирование',
                'verbose_name_plural': 'Бронирования',
                'ordering': ['-created_at'],
            },
        ),
    ]
