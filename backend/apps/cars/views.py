from rest_framework import generics, filters, permissions
from rest_framework.response import Response
from .models import Car
from .serializers import CarSerializer, CarCreateUpdateSerializer
from apps.users.permissions import IsManagerOrAdmin


class CarListView(generics.ListAPIView):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['brand', 'model', 'location', 'license_plate']
    ordering_fields = ['price_per_hour', 'price_per_day', 'year', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Car.objects.all()
        status = self.request.query_params.get('status')
        transmission = self.request.query_params.get('transmission')
        fuel_type = self.request.query_params.get('fuel_type')
        if status:
            qs = qs.filter(status=status)
        if transmission:
            qs = qs.filter(transmission=transmission)
        if fuel_type:
            qs = qs.filter(fuel_type=fuel_type)
        return qs


class CarCreateView(generics.CreateAPIView):
    queryset = Car.objects.all()
    serializer_class = CarCreateUpdateSerializer
    permission_classes = (IsManagerOrAdmin,)


class CarDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Car.objects.all()
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return CarCreateUpdateSerializer
        return CarSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsManagerOrAdmin()]
        return [permissions.IsAuthenticated()]
