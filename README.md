# Carsharing API

## Запуск
```bash
docker-compose up --build
```
Frontend: http://localhost  
Backend API: http://localhost:8000/api/

---

## Роли

| Роль | Что может |
|------|-----------|
| **client** | Смотреть машины, создавать/отменять свои бронирования |
| **manager** | Всё что клиент + управлять автомобилями и любыми бронированиями |
| **admin** | Всё что менеджер + управлять пользователями (роли, блокировка), смотреть статистику |

> Водительское удостоверение обязательно только для клиентов.

---

## API — Аутентификация

### Регистрация
`POST /api/auth/register/`
```json
{
  "email": "user@example.com",
  "username": "user",
  "password": "password123",
  "password2": "password123",
  "role": "client",           // client | manager | admin
  "phone": "+7900000000",
  "driver_license": "77АА123456"  // обязательно только для role=client
}
```

### Вход
`POST /api/auth/login/`
```json
{ "email": "user@example.com", "password": "password123" }
```
Ответ: `{ "access": "...", "refresh": "..." }`

### Выход
`POST /api/auth/logout/`
```json
{ "refresh": "..." }
```

### Обновить токен
`POST /api/auth/token/refresh/`
```json
{ "refresh": "..." }
```

---

## API — Профиль

`GET  /api/auth/profile/` — свой профиль  
`PATCH /api/auth/profile/` — изменить username, phone, driver_license

---

## API — Пользователи (только admin)

`GET  /api/auth/users/` — все пользователи  
Фильтры: `?role=client|manager|admin` `?is_active=true|false`

`GET  /api/auth/users/{id}/` — конкретный пользователь  
`PATCH /api/auth/users/{id}/` — изменить любые поля

`POST /api/auth/users/{id}/block/` — переключить блокировку  
`POST /api/auth/users/{id}/role/` — сменить роль
```json
{ "role": "manager" }
```

`GET /api/auth/stats/` — статистика (пользователи, машины, бронирования, выручка)

---

## API — Автомобили

`GET  /api/cars/` — список (доступно всем авторизованным)  
Фильтры: `?status=available` `?transmission=auto` `?fuel_type=petrol`  
Поиск: `?search=Toyota` Сортировка: `?ordering=price_per_hour`

`POST /api/cars/create/` — добавить машину (manager, admin)  
`GET  /api/cars/{id}/` — детали машины  
`PATCH /api/cars/{id}/` — обновить (manager, admin)  
`DELETE /api/cars/{id}/` — удалить (manager, admin)

---

## API — Бронирования

`GET  /api/bookings/` — все бронирования (manager/admin) или свои (client)  
`POST /api/bookings/` — создать бронирование
```json
{
  "car": 1,
  "start_datetime": "2026-06-15T10:00:00",
  "end_datetime": "2026-06-15T18:00:00",
  "notes": "Комментарий"
}
```

`GET  /api/bookings/my/` — свои бронирования  
`GET  /api/bookings/{id}/` — детали  
`PATCH /api/bookings/{id}/` — менеджер/admin меняет статус:
```json
{ "status": "confirmed" }   // pending → confirmed → active → completed
```
`DELETE /api/bookings/{id}/` — отменить (статус → cancelled)

### Статусы бронирования
`pending` → `confirmed` → `active` → `completed` | `cancelled`
