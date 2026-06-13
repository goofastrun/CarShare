from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    # driver_license только для клиентов — необязательное для остальных
    driver_license = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'role', 'phone', 'driver_license')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Пароли не совпадают.'})

        role = attrs.get('role', User.Role.CLIENT)
        driver_license = attrs.get('driver_license', '')

        # Для клиента водительское удостоверение обязательно
        if role == User.Role.CLIENT and not driver_license:
            raise serializers.ValidationError(
                {'driver_license': 'Для клиента необходимо указать водительское удостоверение.'}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'role', 'role_display', 'phone',
                  'driver_license', 'is_verified', 'created_at', 'is_active')
        read_only_fields = ('id', 'email', 'role', 'is_verified', 'created_at', 'is_active')


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'phone', 'driver_license')


class AdminUserSerializer(serializers.ModelSerializer):
    """Сериализатор для управления пользователями — только для админа."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'role', 'role_display', 'phone',
                  'driver_license', 'is_verified', 'created_at', 'is_active')

    def validate_role(self, value):
        # Нельзя через API снять роль admin у себя — проверяется во view
        return value
