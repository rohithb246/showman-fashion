import uuid
from decimal import Decimal

from django.db import transaction
from django.conf import settings

from cart.models import Cart
from orders.models import Order, OrderItem, Payment
from products.models import Coupon


def generate_order_number():
    return f'TSM-{uuid.uuid4().hex[:8].upper()}'


def calculate_discount(subtotal, coupon):
    if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
        return subtotal * (coupon.discount_value / Decimal('100'))
    return min(coupon.discount_value, subtotal)


@transaction.atomic
def process_checkout(user, data):
    try:
        cart = Cart.objects.prefetch_related('items__variant__inventory').get(user=user)
    except Cart.DoesNotExist:
        raise ValueError('Cart is empty.')

    if not cart.items.exists():
        raise ValueError('Cart is empty.')

    subtotal = cart.subtotal
    discount = Decimal('0')
    coupon = None

    if cart.coupon_code:
        try:
            coupon = Coupon.objects.get(code=cart.coupon_code)
            if coupon.is_valid() and subtotal >= coupon.min_order_amount:
                discount = calculate_discount(subtotal, coupon)
        except Coupon.DoesNotExist:
            pass

    shipping_cost = Decimal('0') if subtotal >= Decimal('999') else Decimal('99')
    tax = (subtotal - discount) * Decimal('0.18')
    total = subtotal - discount + shipping_cost + tax

    order = Order.objects.create(
        user=user,
        order_number=generate_order_number(),
        subtotal=subtotal,
        discount=discount,
        shipping_cost=shipping_cost,
        tax=tax,
        total=total,
        coupon=coupon,
        shipping_name=data['shipping_name'],
        shipping_phone=data['shipping_phone'],
        shipping_address=data['shipping_address'],
        shipping_city=data['shipping_city'],
        shipping_state=data['shipping_state'],
        shipping_postal_code=data['shipping_postal_code'],
        shipping_country=data['shipping_country'],
        notes=data.get('notes', ''),
    )

    for cart_item in cart.items.select_related('variant__product', 'variant__size', 'variant__color'):
        variant = cart_item.variant
        if variant.inventory.quantity < cart_item.quantity:
            raise ValueError(f'Insufficient stock for {variant.product.name}.')
        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name=variant.product.name,
            size=variant.size.name,
            color=variant.color.name,
            quantity=cart_item.quantity,
            unit_price=variant.price,
            total_price=variant.price * cart_item.quantity,
        )
        variant.inventory.quantity -= cart_item.quantity
        variant.inventory.save()

    payment_status = (
        Payment.Status.SUCCESS if data['payment_provider'] == Payment.Provider.COD
        else Payment.Status.PENDING
    )
    Payment.objects.create(
        order=order,
        provider=data['payment_provider'],
        status=payment_status,
        amount=total,
    )

    if coupon:
        coupon.used_count += 1
        coupon.save()

    cart.items.all().delete()
    cart.coupon_code = ''
    cart.save()

    if data['payment_provider'] != Payment.Provider.COD:
        order.status = Order.Status.PENDING
        order.save()
    else:
        order.status = Order.Status.CONFIRMED
        order.save()

    return order


def confirm_payment(user, order_number, transaction_id, success, payment_data):
    order = Order.objects.get(order_number=order_number, user=user)
    payment = order.payment
    if success:
        payment.status = Payment.Status.SUCCESS
        payment.transaction_id = transaction_id
        payment.payment_data = payment_data
        payment.save()
        order.status = Order.Status.CONFIRMED
        order.save()
    else:
        payment.status = Payment.Status.FAILED
        payment.payment_data = payment_data
        payment.save()
    return order


def get_payment_config():
    return {
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
        'providers': [p.value for p in Payment.Provider],
    }
