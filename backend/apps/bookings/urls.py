from django.urls import path
from .views import BookingListCreateView, BookingDetailView, MyBookingsView

urlpatterns = [
    path('', BookingListCreateView.as_view(), name='booking-list-create'),
    path('my/', MyBookingsView.as_view(), name='my-bookings'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
]
