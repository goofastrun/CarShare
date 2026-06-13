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
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Роли

| Роль | Права |
|------|-------|
| client | просмотр автомобилей, свои бронирования |
| manager | управление автопарком и всеми бронированиями |
| admin | всё выше + управление пользователями, статистика |

Водительское удостоверение при регистрации требуется только для клиентов.

## Переменные окружения

| Переменная | Описание |
|-----------|----------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | 1 в разработке, 0 в продакшене |
| `DATABASE_URL` | строка подключения к БД (для Railway) |
| `DB_HOST / DB_NAME / DB_USER / DB_PASSWORD` | параметры БД (для Docker) |

## Тесты

```bash
docker compose exec backend pytest tests/test_fuzz.py -v
```
