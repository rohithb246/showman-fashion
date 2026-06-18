from django.db import migrations


def seed_fashion_categories(apps, schema_editor):
    Category = apps.get_model('products', 'Category')
    SubCategory = apps.get_model('products', 'SubCategory')

    footwear = Category.objects.filter(slug='footwear').first()
    shoes = Category.objects.filter(slug='shoes').first()
    if footwear and not shoes:
        footwear.slug = 'shoes'
        footwear.name = 'Shoes'
        footwear.description = 'Designer shoes for every occasion'
        footwear.save(update_fields=['slug', 'name', 'description'])
    elif footwear and shoes:
        footwear.products.update(category=shoes)
        footwear.is_active = False
        footwear.save(update_fields=['is_active'])

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
    categories = {}
    for slug, name, description in categories_data:
        category, _ = Category.objects.update_or_create(
            slug=slug,
            defaults={'name': name, 'description': description, 'is_active': True},
        )
        categories[slug] = category

    subcategories_data = [
        ('mens-wear', 'shirts', 'Shirts'),
        ('mens-wear', 't-shirts', 'T-Shirts'),
        ('mens-wear', 'pants', 'Pants'),
        ('mens-wear', 'jeans', 'Jeans'),
        ('mens-wear', 'suits', 'Suits'),
        ('mens-wear', 'blazers', 'Blazers'),
        ('mens-wear', 'jackets', 'Jackets'),
        ('mens-wear', 'kurtas', 'Kurtas'),
        ('womens-wear', 'tops', 'Tops'),
        ('womens-wear', 'shirts', 'Shirts'),
        ('womens-wear', 'dresses', 'Dresses'),
        ('womens-wear', 'skirts', 'Skirts'),
        ('womens-wear', 'jeans', 'Jeans'),
        ('womens-wear', 'sarees', 'Sarees'),
        ('womens-wear', 'kurtis', 'Kurtis'),
        ('womens-wear', 'gowns', 'Gowns'),
        ('shoes', 'sneakers', 'Sneakers'),
        ('shoes', 'formal-shoes', 'Formal Shoes'),
        ('shoes', 'loafers', 'Loafers'),
        ('shoes', 'boots', 'Boots'),
        ('shoes', 'sandals', 'Sandals'),
        ('accessories', 'belts', 'Belts'),
        ('accessories', 'watches', 'Watches'),
        ('accessories', 'bags', 'Bags'),
        ('accessories', 'sunglasses', 'Sunglasses'),
        ('accessories', 'wallets', 'Wallets'),
        ('accessories', 'jewellery', 'Jewellery'),
        ('accessories', 'ties', 'Ties'),
        ('kids-wear', 'boys-clothing', "Boys' Clothing"),
        ('kids-wear', 'girls-clothing', "Girls' Clothing"),
        ('kids-wear', 'kids-shoes', "Kids' Shoes"),
        ('ethnic-wear', 'sherwanis', 'Sherwanis'),
        ('ethnic-wear', 'lehengas', 'Lehengas'),
        ('ethnic-wear', 'kurta-sets', 'Kurta Sets'),
        ('sportswear', 'track-pants', 'Track Pants'),
        ('sportswear', 'hoodies', 'Hoodies'),
        ('sportswear', 'active-t-shirts', 'Active T-Shirts'),
        ('winter-wear', 'coats', 'Coats'),
        ('winter-wear', 'sweaters', 'Sweaters'),
        ('winter-wear', 'scarves', 'Scarves'),
    ]
    for category_slug, slug, name in subcategories_data:
        SubCategory.objects.update_or_create(
            category=categories[category_slug],
            slug=slug,
            defaults={'name': name, 'is_active': True},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0002_product_brand_and_more_options'),
    ]

    operations = [
        migrations.RunPython(seed_fashion_categories, noop_reverse),
    ]
