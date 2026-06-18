import uuid
import base64
import hashlib
import hmac
import json
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.db import transaction
from django.conf import settings

from cart.models import Cart
from orders.models import Order, OrderItem, Payment
from products.models import Coupon, ProductVariant


def generate_order_number():
    return f'TSM-{uuid.uuid4().hex[:8].upper()}'


def calculate_discount(subtotal, coupon):
    if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
        return subtotal * (coupon.discount_value / Decimal('100'))
    return min(coupon.discount_value, subtotal)


def create_razorpay_order(order):
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError('Razorpay is not configured.')

    credentials = base64.b64encode(
        f'{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}'.encode()
    ).decode()
    payload = json.dumps({
        'amount': int(order.total * 100),
        'currency': 'INR',
        'receipt': order.order_number,
        'notes': {'local_order_number': order.order_number},
    }).encode()
    request = Request(
        'https://api.razorpay.com/v1/orders',
        data=payload,
        headers={
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode())
    except (HTTPError, URLError, TimeoutError) as exc:
        raise ValueError('Could not initialize Razorpay. Please try again.') from exc


def verify_razorpay_signature(payment, payment_id, gateway_order_id, signature):
    if not all([payment_id, gateway_order_id, signature]):
        return False
    if payment.transaction_id != gateway_order_id:
        return False
    message = f'{gateway_order_id}|{payment_id}'.encode()
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


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
        try:
            variant = ProductVariant.objects.select_for_update().select_related(
                'product', 'size', 'color', 'inventory'
            ).get(
                id=cart_item.variant_id,
                is_active=True,
                product__is_active=True,
            )
        except ProductVariant.DoesNotExist as exc:
            raise ValueError('One or more products in your cart are no longer available.') from exc
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
    payment = Payment.objects.create(
        order=order,
        provider=data['payment_provider'],
        status=payment_status,
        amount=total,
    )

    if data['payment_provider'] == Payment.Provider.RAZORPAY:
        gateway_order = create_razorpay_order(order)
        payment.transaction_id = gateway_order['id']
        payment.payment_data = {
            'gateway_order': gateway_order,
        }
        payment.save(update_fields=['transaction_id', 'payment_data'])
    elif data['payment_provider'] == Payment.Provider.STRIPE:
        raise ValueError('Stripe checkout is not enabled. Please use Razorpay or Cash on Delivery.')

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


def confirm_payment(user, order_number, payment_data):
    order = Order.objects.get(order_number=order_number, user=user)
    payment = order.payment
    if payment.provider != Payment.Provider.RAZORPAY:
        raise ValueError('This payment cannot be confirmed through Razorpay.')

    payment_id = payment_data.get('razorpay_payment_id', '')
    gateway_order_id = payment_data.get('razorpay_order_id', '')
    signature = payment_data.get('razorpay_signature', '')
    if not verify_razorpay_signature(payment, payment_id, gateway_order_id, signature):
        raise ValueError('Payment verification failed.')

    payment.status = Payment.Status.SUCCESS
    payment.transaction_id = payment_id
    payment.payment_data = {**payment.payment_data, 'confirmation': payment_data}
    payment.save()
    order.status = Order.Status.CONFIRMED
    order.save()
    return order


@transaction.atomic
def restore_order_inventory(order):
    for item in order.items.select_related('variant__inventory').select_for_update():
        item.variant.inventory.quantity += item.quantity
        item.variant.inventory.save(update_fields=['quantity'])


def get_payment_config():
    providers = [Payment.Provider.COD.value]
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        providers.append(Payment.Provider.RAZORPAY.value)
    return {
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'providers': providers,
    }
