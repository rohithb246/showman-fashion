from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from products.models import (
    Category, SubCategory, Size, Color, Product, ProductVariant,
    Inventory, Coupon, Banner,
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample data for The Show Man'

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            email='admin@theshowman.com',
            defaults={
                'username': 'admin',
                'first_name': 'Show',
                'last_name': 'Admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'email_verified': True,
            },
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Admin user created: admin@theshowman.com / admin123'))

        sizes = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38', '40', '42', '44', '6', '7', '8', '9', '10', '11', '12']
        for i, name in enumerate(sizes):
            Size.objects.get_or_create(name=name, defaults={'sort_order': i})

        colors = [
            ('Black', '#000000'), ('White', '#FFFFFF'), ('Gold', '#FFD700'),
            ('Purple', '#4A0560'), ('Navy', '#1a1a4e'), ('Burgundy', '#800020'),
            ('Charcoal', '#36454F'), ('Ivory', '#FFFFF0'), ('Silver', '#C0C0C0'),
            ('Champagne', '#F7E7CE'), ('Emerald', '#046307'), ('Royal Blue', '#4169E1'),
            ('Brown', '#5C4033'), ('Tan', '#D2B48C'), ('Maroon', '#800000'),
            ('Red', '#D90429'), ('Beige', '#F5F5DC'), ('Grey', '#808080'),
        ]
        for name, hex_code in colors:
            Color.objects.get_or_create(name=name, defaults={'hex_code': hex_code})

        categories_data = [
            ('mens-wear', "Men's Wear", 'Premium mens fashion collection'),
            ('womens-wear', "Women's Wear", 'Elegant womens fashion'),
            ('shoes', 'Shoes', 'Designer shoes for every occasion'),
            ('accessories', 'Accessories', 'Luxury accessories'),
            ('kids-wear', "Kids' Wear", 'Stylish outfits for kids'),
            ('ethnic-wear', 'Ethnic Wear', 'Traditional and festive fashion'),
            ('sportswear', 'Sportswear', 'Comfortable activewear and athleisure'),
            ('winter-wear', 'Winter Wear', 'Warm layers and seasonal essentials'),
        ]
        for slug, name, desc in categories_data:
            Category.objects.update_or_create(slug=slug, defaults={'name': name, 'description': desc})

        mens = Category.objects.get(slug='mens-wear')
        womens = Category.objects.get(slug='womens-wear')
        shoes = Category.objects.get(slug='shoes')
        accessories = Category.objects.get(slug='accessories')
        kids = Category.objects.get(slug='kids-wear')
        ethnic = Category.objects.get(slug='ethnic-wear')
        sportswear = Category.objects.get(slug='sportswear')
        winter = Category.objects.get(slug='winter-wear')

        subcategories_data = [
            (mens, 'shirts', 'Shirts'),
            (mens, 't-shirts', 'T-Shirts'),
            (mens, 'pants', 'Pants'),
            (mens, 'jeans', 'Jeans'),
            (mens, 'suits', 'Suits'),
            (mens, 'blazers', 'Blazers'),
            (mens, 'jackets', 'Jackets'),
            (mens, 'kurtas', 'Kurtas'),
            (womens, 'tops', 'Tops'),
            (womens, 'shirts', 'Shirts'),
            (womens, 'dresses', 'Dresses'),
            (womens, 'skirts', 'Skirts'),
            (womens, 'jeans', 'Jeans'),
            (womens, 'sarees', 'Sarees'),
            (womens, 'kurtis', 'Kurtis'),
            (womens, 'gowns', 'Gowns'),
            (shoes, 'sneakers', 'Sneakers'),
            (shoes, 'formal-shoes', 'Formal Shoes'),
            (shoes, 'loafers', 'Loafers'),
            (shoes, 'boots', 'Boots'),
            (shoes, 'sandals', 'Sandals'),
            (accessories, 'belts', 'Belts'),
            (accessories, 'watches', 'Watches'),
            (accessories, 'bags', 'Bags'),
            (accessories, 'sunglasses', 'Sunglasses'),
            (accessories, 'wallets', 'Wallets'),
            (accessories, 'jewellery', 'Jewellery'),
            (accessories, 'ties', 'Ties'),
            (kids, 'boys-clothing', "Boys' Clothing"),
            (kids, 'girls-clothing', "Girls' Clothing"),
            (kids, 'kids-shoes', "Kids' Shoes"),
            (ethnic, 'sherwanis', 'Sherwanis'),
            (ethnic, 'lehengas', 'Lehengas'),
            (ethnic, 'kurta-sets', 'Kurta Sets'),
            (sportswear, 'track-pants', 'Track Pants'),
            (sportswear, 'hoodies', 'Hoodies'),
            (sportswear, 'active-t-shirts', 'Active T-Shirts'),
            (winter, 'coats', 'Coats'),
            (winter, 'sweaters', 'Sweaters'),
            (winter, 'scarves', 'Scarves'),
        ]
        for category, slug, name in subcategories_data:
            SubCategory.objects.update_or_create(category=category, slug=slug, defaults={'name': name})

        products_data = [
            ('velvet-blazer', 'Velvet Showman Blazer', mens, 8999, 7499, True, True, True),
            ('silk-tuxedo', 'Silk Midnight Tuxedo', mens, 15999, None, True, False, True),
            ('gold-cufflinks', 'Gold Plated Cufflinks Set', accessories, 2999, 2499, False, True, False),
            ('sequin-gown', 'Sequined Evening Gown', womens, 12999, 10999, True, True, True),
            ('leather-loafers', 'Handcrafted Leather Loafers', shoes, 6999, None, False, True, True),
            ('cashmere-overcoat', 'Cashmere Overcoat', mens, 18999, 15999, True, False, True),
            ('satin-blouse', 'Satin Drape Blouse', womens, 4499, 3999, False, True, False),
            ('designer-belt', 'Designer Leather Belt', accessories, 3499, None, False, False, True),
        ]

        size_objs = list(Size.objects.all())
        color_objs = list(Color.objects.all())

        for slug, name, cat, price, sale, featured, new_arr, trending in products_data:
            product, _ = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'description': f'Experience luxury with our {name}. Crafted with premium materials for the modern showman.',
                    'specifications': {'Material': 'Premium', 'Care': 'Dry clean only', 'Origin': 'Italy'},
                    'category': cat,
                    'base_price': Decimal(str(price)),
                    'sale_price': Decimal(str(sale)) if sale else None,
                    'is_featured': featured,
                    'is_new_arrival': new_arr,
                    'is_trending': trending,
                },
            )
            for size in size_objs[:4]:
                for color in color_objs[:3]:
                    sku = f'{slug}-{size.name}-{color.name}'.upper().replace(' ', '-')
                    variant, v_created = ProductVariant.objects.get_or_create(
                        product=product, size=size, color=color,
                        defaults={'sku': sku, 'price_adjustment': Decimal('0')},
                    )
                    if v_created:
                        Inventory.objects.create(variant=variant, quantity=25, low_stock_threshold=5)

        now = timezone.now()
        Coupon.objects.get_or_create(
            code='SHOWMAN20',
            defaults={
                'description': '20% off on orders above ₹2000',
                'discount_type': Coupon.DiscountType.PERCENTAGE,
                'discount_value': Decimal('20'),
                'min_order_amount': Decimal('2000'),
                'max_uses': 100,
                'valid_from': now,
                'valid_until': now + timedelta(days=90),
            },
        )

        Banner.objects.get_or_create(
            title='Dress Like A Showman',
            defaults={
                'subtitle': 'Discover our exclusive luxury collection',
                'image': 'banners/placeholder.jpg',
                'link': '/shop',
                'banner_type': Banner.BannerType.HERO,
                'sort_order': 0,
            },
        )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
