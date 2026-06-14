# CarShare

Веб-приложение для аренды автомобилей. Django REST Framework + PostgreSQL + Nginx, всё в Docker.

## Запуск

```bash
docker-compose up --build
```

Сайт: http://localhost  
API: http://localhost:8000/api/

## Структура проекта

```
carsharing/
├── backend/
│   ├── apps/
│   │   ├── users/        # пользователи, JWT-аутентификация
│   │   ├── cars/         # автомобили
│   │   └── bookings/     # бронирования
│   ├── config/           # настройки Django
│   ├── tests/            # фаззинг-тесты
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── js/
│   │   ├── api.js        # HTTP-клиент
│   │   ├── app.js        # роутинг
│   │   ├── auth.js       # авторизация
│   │   ├── cars.js       # страница автомобилей
│   │   ├── bookings.js   # страница бронирований
│   │   └── admin.js      # панель администратора
│   ├── css/
│   │   └── main.css      # Cтили
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Роли

| Роль | Права |
|------|-------|
| client | Просмотр автомобилей, свои бронирования |
| manager | Управление автопарком и всеми бронированиями |
| admin | Управление пользователями, статистика |

Водительское удостоверение при регистрации требуется только для клиентов.


## Тесты

```bash
docker compose exec backend pytest tests/test_fuzz.py -v
```
