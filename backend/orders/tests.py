import hashlib
import hmac

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from orders.models import Order, Payment
from orders.services import confirm_payment


User = get_user_model()


@override_settings(RAZORPAY_KEY_ID='rzp_test_key', RAZORPAY_KEY_SECRET='test_secret')
class RazorpayVerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='buyer',
            email='buyer@example.com',
            password='password123',
        )
        self.order = Order.objects.create(
            user=self.user,
            order_number='TSM-TEST1234',
            subtotal='1000.00',
            total='1180.00',
            shipping_name='Buyer',
            shipping_phone='9999999999',
            shipping_address='1 Test Street',
            shipping_city='Mumbai',
            shipping_state='Maharashtra',
            shipping_postal_code='400001',
            shipping_country='India',
        )
        self.payment = Payment.objects.create(
            order=self.order,
            provider=Payment.Provider.RAZORPAY,
            status=Payment.Status.PENDING,
            amount='1180.00',
            transaction_id='order_gateway_123',
        )

    def test_valid_gateway_signature_confirms_payment(self):
        payment_id = 'pay_123'
        message = f'{self.payment.transaction_id}|{payment_id}'.encode()
        signature = hmac.new(b'test_secret', message, hashlib.sha256).hexdigest()

        order = confirm_payment(self.user, self.order.order_number, {
            'razorpay_payment_id': payment_id,
            'razorpay_order_id': self.payment.transaction_id,
            'razorpay_signature': signature,
        })

        self.assertEqual(order.payment.status, Payment.Status.SUCCESS)
        self.assertEqual(order.status, Order.Status.CONFIRMED)

    def test_invalid_gateway_signature_is_rejected(self):
        with self.assertRaisesMessage(ValueError, 'Payment verification failed.'):
            confirm_payment(self.user, self.order.order_number, {
                'razorpay_payment_id': 'pay_123',
                'razorpay_order_id': self.payment.transaction_id,
                'razorpay_signature': 'invalid',
            })
