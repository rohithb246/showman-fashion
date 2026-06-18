import base64
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase

from products.models import Banner, Category, Color, Coupon, Inventory, Product, ProductVariant, Review, Size


User = get_user_model()


class ProductVisibilityTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Formal', slug='formal')
        self.visible = Product.objects.create(
            name='Visible',
            slug='visible',
            description='Visible product',
            category=self.category,
            base_price='1000.00',
            is_active=True,
        )
        self.hidden = Product.objects.create(
            name='Hidden',
            slug='hidden',
            description='Hidden product',
            category=self.category,
            base_price='1000.00',
            is_active=False,
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role=User.Role.ADMIN,
        )

    def test_hidden_products_never_leak_to_public_storefront(self):
        response = self.client.get('/api/products/')
        slugs = [item['slug'] for item in response.data['results']]
        self.assertEqual(slugs, ['visible'])

        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/products/')
        slugs = [item['slug'] for item in response.data['results']]
        self.assertEqual(slugs, ['visible'])

    def test_admin_can_explicitly_request_hidden_products(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/products/?include_inactive=true')
        slugs = {item['slug'] for item in response.data['results']}
        self.assertEqual(slugs, {'visible', 'hidden'})

    def test_admin_can_show_a_hidden_product(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'/api/products/{self.hidden.slug}/',
            {'is_active': True},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.hidden.refresh_from_db()
        self.assertTrue(self.hidden.is_active)


class BulkVariantTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name='Suits', slug='suits')
        self.product = Product.objects.create(
            name='Stage Suit',
            slug='stage-suit',
            description='A suit',
            category=category,
            base_price='2500.00',
        )
        self.small = Size.objects.create(name='S', sort_order=1)
        self.medium = Size.objects.create(name='M', sort_order=2)
        self.black = Color.objects.create(name='Black', hex_code='#000000')
        self.gold = Color.objects.create(name='Gold', hex_code='#FFD700')
        admin = User.objects.create_user(
            username='admin2',
            email='admin2@example.com',
            password='password123',
            role=User.Role.ADMIN,
        )
        self.client.force_authenticate(admin)

    def test_bulk_create_builds_size_color_matrix_without_duplicates(self):
        payload = {
            'product_id': self.product.id,
            'size_ids': [self.small.id, self.medium.id],
            'color_ids': [self.black.id, self.gold.id],
            'quantity': 8,
            'low_stock_threshold': 2,
        }
        response = self.client.post('/api/products/variants/bulk_create/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ProductVariant.objects.filter(product=self.product).count(), 4)
        self.assertEqual(Inventory.objects.filter(variant__product=self.product, quantity=8).count(), 4)

        second_response = self.client.post('/api/products/variants/bulk_create/', payload, format='json')
        self.assertEqual(second_response.status_code, 201)
        self.assertEqual(ProductVariant.objects.filter(product=self.product).count(), 4)

    def test_deleting_inventory_removes_the_complete_variant(self):
        variant = ProductVariant.objects.create(
            product=self.product,
            size=self.small,
            color=self.black,
            sku='DELETE-ME',
        )
        inventory = Inventory.objects.create(variant=variant, quantity=1)
        response = self.client.delete(f'/api/products/inventory/{inventory.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(ProductVariant.objects.filter(id=variant.id).exists())


class ReviewModerationTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name='Review Category', slug='review-category')
        product = Product.objects.create(
            name='Reviewed Product',
            slug='reviewed-product',
            description='Reviewed',
            category=category,
            base_price='100.00',
        )
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='password123',
        )
        self.admin = User.objects.create_user(
            username='review-admin',
            email='review-admin@example.com',
            password='password123',
            role=User.Role.ADMIN,
        )
        self.review = Review.objects.create(
            product=product,
            user=self.customer,
            rating=5,
            comment='Excellent',
        )

    def test_admin_can_approve_and_hide_review(self):
        self.client.force_authenticate(self.admin)
        approve = self.client.post(f'/api/products/reviews/{self.review.id}/approve/')
        self.assertEqual(approve.status_code, 200)
        self.review.refresh_from_db()
        self.assertTrue(self.review.is_approved)

        reject = self.client.post(f'/api/products/reviews/{self.review.id}/reject/')
        self.assertEqual(reject.status_code, 200)
        self.review.refresh_from_db()
        self.assertFalse(self.review.is_approved)

    def test_customer_cannot_moderate_review(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(f'/api/products/reviews/{self.review.id}/approve/')
        self.assertEqual(response.status_code, 403)


class MarketingAdminTests(APITestCase):
    def setUp(self):
        admin = User.objects.create_user(
            username='marketing-admin',
            email='marketing-admin@example.com',
            password='password123',
            role=User.Role.ADMIN,
        )
        self.client.force_authenticate(admin)

    def test_coupon_create_toggle_and_delete(self):
        now = timezone.now()
        response = self.client.post('/api/products/coupons/', {
            'code': 'WELCOME10',
            'description': 'Welcome offer',
            'discount_type': 'percentage',
            'discount_value': '10.00',
            'min_order_amount': '500.00',
            'max_uses': 25,
            'is_active': True,
            'valid_from': now.isoformat(),
            'valid_until': (now + timedelta(days=30)).isoformat(),
        }, format='json')
        self.assertEqual(response.status_code, 201)
        coupon_id = response.data['id']

        toggle = self.client.patch(
            f'/api/products/coupons/{coupon_id}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(toggle.status_code, 200)
        self.assertFalse(toggle.data['is_active'])

        deleted = self.client.delete(f'/api/products/coupons/{coupon_id}/')
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Coupon.objects.filter(id=coupon_id).exists())

    def test_banner_create_toggle_and_delete(self):
        one_pixel_gif = base64.b64decode(
            'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
        )
        image = SimpleUploadedFile('banner.gif', one_pixel_gif, content_type='image/gif')
        response = self.client.post('/api/products/banners/', {
            'title': 'Mobile Banner',
            'subtitle': 'Responsive',
            'link': '/shop',
            'banner_type': 'hero',
            'is_active': True,
            'sort_order': 1,
            'image': image,
        }, format='multipart')
        self.assertEqual(response.status_code, 201)
        banner_id = response.data['id']

        toggle = self.client.patch(
            f'/api/products/banners/{banner_id}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(toggle.status_code, 200)
        self.assertFalse(toggle.data['is_active'])

        deleted = self.client.delete(f'/api/products/banners/{banner_id}/')
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Banner.objects.filter(id=banner_id).exists())
