from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart, CartItem, Wishlist
from cart.serializers import CartSerializer, CartItemSerializer, WishlistSerializer
from products.models import Product
from products.models import ProductVariant


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    cart.items.filter(
        product_variant_is_invalid_filter()
    ).delete()
    return cart


def product_variant_is_invalid_filter():
    from django.db.models import Q
    return Q(variant__is_active=False) | Q(variant__product__is_active=False)


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        cart.coupon_code = ''
        cart.save()
        return Response({'detail': 'Cart cleared.'})


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart = get_or_create_cart(request.user)
        variant_id = request.data.get('variant_id')
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'detail': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity < 1:
            return Response({'detail': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            variant = ProductVariant.objects.select_related('inventory', 'product').get(
                id=variant_id,
                is_active=True,
                product__is_active=True,
            )
        except ProductVariant.DoesNotExist:
            return Response({'detail': 'Variant not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(variant, 'inventory') or variant.inventory.quantity < quantity:
            return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant, defaults={'quantity': quantity})
        if not created:
            item.quantity += quantity
            if item.quantity > variant.inventory.quantity:
                return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)
            item.save()

        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def patch(self, request, item_id):
        cart = get_or_create_cart(request.user)
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            quantity = int(request.data.get('quantity', item.quantity))
        except (TypeError, ValueError):
            return Response({'detail': 'Quantity must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            item.delete()
        else:
            if quantity > item.variant.inventory.quantity:
                return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = quantity
            item.save()

        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, item_id):
        cart = get_or_create_cart(request.user)
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return Response(CartSerializer(cart, context={'request': request}).data)


class ApplyCouponView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from products.models import Coupon
        cart = get_or_create_cart(request.user)
        code = request.data.get('code', '').upper()
        try:
            coupon = Coupon.objects.get(code=code)
            if coupon.is_valid() and cart.subtotal >= coupon.min_order_amount:
                cart.coupon_code = code
                cart.save()
                return Response(CartSerializer(cart, context={'request': request}).data)
            if coupon.is_valid():
                return Response(
                    {'detail': f'Minimum order amount is ₹{coupon.min_order_amount}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response({'detail': 'Coupon is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response({'detail': 'Invalid coupon.'}, status=status.HTTP_404_NOT_FOUND)


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(
            user=request.user,
            product__is_active=True,
        ).select_related('product')
        return Response(WishlistSerializer(items, many=True, context={'request': request}).data)

    def post(self, request):
        product_id = request.data.get('product_id')
        if not Product.objects.filter(id=product_id, is_active=True).exists():
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        item, created = Wishlist.objects.get_or_create(user=request.user, product_id=product_id)
        if created:
            return Response(WishlistSerializer(item, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response({'detail': 'Already in wishlist.'}, status=status.HTTP_200_OK)

    def delete(self, request, product_id=None):
        Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({'detail': 'Removed from wishlist.'})
