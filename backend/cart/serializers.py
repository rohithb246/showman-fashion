from decimal import Decimal

from rest_framework import serializers
from cart.models import Cart, CartItem, Wishlist
from products.models import Coupon, Product, ProductVariant
from products.serializers import ProductListSerializer, ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(),
        source='variant', write_only=True
    )
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'variant', 'variant_id', 'quantity', 'total_price', 'added_at']
        read_only_fields = ['added_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    coupon = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            'id', 'items', 'subtotal', 'item_count', 'coupon_code',
            'coupon', 'discount_amount', 'total', 'updated_at',
        ]

    def _get_valid_coupon(self, obj):
        if not obj.coupon_code:
            return None
        try:
            coupon = Coupon.objects.get(code=obj.coupon_code.upper())
        except Coupon.DoesNotExist:
            return None
        if not coupon.is_valid() or obj.subtotal < coupon.min_order_amount:
            return None
        return coupon

    def get_coupon(self, obj):
        coupon = self._get_valid_coupon(obj)
        if not coupon:
            return None
        return {
            'code': coupon.code,
            'description': coupon.description,
            'discount_type': coupon.discount_type,
            'discount_value': f'{coupon.discount_value:.2f}',
            'min_order_amount': f'{coupon.min_order_amount:.2f}',
        }

    def get_discount_amount(self, obj):
        coupon = self._get_valid_coupon(obj)
        if not coupon:
            return '0.00'
        if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
            discount = obj.subtotal * (coupon.discount_value / 100)
        else:
            discount = min(coupon.discount_value, obj.subtotal)
        return f'{discount:.2f}'

    def get_total(self, obj):
        return f'{obj.subtotal - Decimal(self.get_discount_amount(obj)):.2f}'


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source='product', write_only=True
    )

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'added_at']
        read_only_fields = ['added_at']
