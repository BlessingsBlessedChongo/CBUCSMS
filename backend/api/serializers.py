from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Category, Stock, StockRequest, BlockchainLog


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'role', 'department', 'phone', 'wallet_address', 'password']
        read_only_fields = ['wallet_address']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid username or password')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
            return data
        raise serializers.ValidationError('Must include "username" and "password"')


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Stock
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at', 'created_by']


class StockRequestSerializer(serializers.ModelSerializer):
    requested_by_username = serializers.CharField(source='requested_by.username', read_only=True)
    stock_name = serializers.CharField(source='stock.name', read_only=True)

    class Meta:
        model = StockRequest
        fields = [
            'id',
            'stock',
            'quantity_requested',
            'priority',
            'reason',
            'status',
            'created_at',
            'requested_by_username',
            'stock_name',
        ]
        read_only_fields = ['status', 'created_at', 'requested_by', 'department']
        extra_kwargs = {
            'stock': {'required': True},
            'quantity_requested': {'required': True},
            'priority': {'required': False},
            'reason': {'required': False},
        }

    def validate_quantity_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError('Requested quantity must be greater than zero.')
        return value

    def validate(self, data):
        stock = data.get('stock')
        quantity_requested = data.get('quantity_requested')
        if stock and quantity_requested is not None and quantity_requested > stock.current_quantity:
            raise serializers.ValidationError({
                'quantity_requested': 'Requested quantity exceeds available stock.'
            })
        return data


class BlockchainLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockchainLog
        fields = '__all__'