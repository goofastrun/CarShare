from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Car',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('brand', models.CharField(max_length=100, verbose_name='Марка')),
                ('model', models.CharField(max_length=100, verbose_name='Модель')),
                ('year', models.PositiveIntegerField(verbose_name='Год выпуска')),
                ('license_plate', models.CharField(max_length=20, unique=True, verbose_name='Гос. номер')),
                ('color', models.CharField(max_length=50, verbose_name='Цвет')),
                ('transmission', models.CharField(
                    choices=[('auto', 'Автомат'), ('manual', 'Механика')],
                    default='auto',
                    max_length=10,
                    verbose_name='Коробка передач',
                )),
                ('fuel_type', models.CharField(
                    choices=[('petrol', 'Бензин'), ('diesel', 'Дизель'), ('electric', 'Электро'), ('hybrid', 'Гибрид')],
                    default='petrol',
                    max_length=10,
                    verbose_name='Тип топлива',
                )),
                ('seats', models.PositiveIntegerField(default=5, verbose_name='Мест')),
                ('price_per_hour', models.DecimalField(decimal_places=2, max_digits=8, verbose_name='Цена в час (руб.)')),
                ('price_per_day', models.DecimalField(decimal_places=2, max_digits=8, verbose_name='Цена в день (руб.)')),
                ('status', models.CharField(
                    choices=[
                        ('available', 'Доступна'),
                        ('booked', 'Забронирована'),
                        ('maintenance', 'На обслуживании'),
                        ('unavailable', 'Недоступна'),
                    ],
                    default='available',
                    max_length=20,
                    verbose_name='Статус',
                )),
                ('location', models.CharField(max_length=255, verbose_name='Местонахождение')),
                ('mileage', models.PositiveIntegerField(default=0, verbose_name='Пробег (км)')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('image', models.ImageField(blank=True, null=True, upload_to='cars/', verbose_name='Фото')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Автомобиль',
                'verbose_name_plural': 'Автомобили',
                'ordering': ['-created_at'],
            },
        ),
    ]
