from rest_framework import serializers
from orders.models import Order, OrderItem, Payment


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'size', 'color', 'quantity',
            'unit_price', 'total_price',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'provider', 'status', 'amount', 'transaction_id', 'created_at']
        read_only_fields = ['status', 'transaction_id', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'subtotal', 'discount',
            'shipping_cost', 'tax', 'total', 'items', 'payment',
            'shipping_name', 'shipping_phone', 'shipping_address',
            'shipping_city', 'shipping_state', 'shipping_postal_code',
            'shipping_country', 'tracking_number', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['order_number', 'created_at', 'updated_at']


class CreateOrderSerializer(serializers.Serializer):
    shipping_name = serializers.CharField(max_length=150)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100, default='India')
    payment_provider = serializers.ChoiceField(choices=Payment.Provider.choices, default=Payment.Provider.COD)
    notes = serializers.CharField(required=False, allow_blank=True)
