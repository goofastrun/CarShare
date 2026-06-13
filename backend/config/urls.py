from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/auth/', include('apps.users.urls')),
    path('api/cars/', include('apps.cars.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
