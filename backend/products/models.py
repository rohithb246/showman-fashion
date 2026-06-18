from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subcategories'
        verbose_name_plural = 'subcategories'
        unique_together = [['category', 'slug']]
        ordering = ['name']

    def __str__(self):
        return f'{self.category.name} > {self.name}'


class Size(models.Model):
    name = models.CharField(max_length=20, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'sizes'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Color(models.Model):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(max_length=7, default='#000000')

    class Meta:
        db_table = 'colors'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    brand_name = models.CharField(max_length=120, blank=True)
    description = models.TextField()
    specifications = models.JSONField(default=dict, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    subcategory = models.ForeignKey(
        SubCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products'
    )
    base_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    sale_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_featured', 'is_active']),
            models.Index(fields=['is_new_arrival', 'is_active']),
            models.Index(fields=['is_trending', 'is_active']),
        ]

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        return self.sale_price if self.sale_price else self.base_price

    @property
    def average_rating(self):
        result = self.reviews.filter(is_approved=True).aggregate(
            avg=models.Avg('rating')
        )
        return round(result['avg'] or 0, 1)

    @property
    def review_count(self):
        return self.reviews.filter(is_approved=True).count()


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'product_images'
        ordering = ['-is_primary', 'sort_order']

    def __str__(self):
        return f'Image for {self.product.name}'


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.ForeignKey(Size, on_delete=models.PROTECT, related_name='variants')
    color = models.ForeignKey(Color, on_delete=models.PROTECT, related_name='variants')
    sku = models.CharField(max_length=50, unique=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_variants'
        unique_together = [['product', 'size', 'color']]
        indexes = [models.Index(fields=['sku'])]

    def __str__(self):
        return f'{self.product.name} - {self.size.name} - {self.color.name}'

    @property
    def price(self):
        return self.product.effective_price + self.price_adjustment


class Inventory(models.Model):
    variant = models.OneToOneField(ProductVariant, on_delete=models.CASCADE, related_name='inventory')
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory'
        verbose_name_plural = 'inventory'

    def __str__(self):
        return f'{self.variant.sku}: {self.quantity}'

    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold

    @property
    def in_stock(self):
        return self.quantity > 0


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        unique_together = [['product', 'user']]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.product.name} ({self.rating})'


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage'
        FIXED = 'fixed', 'Fixed Amount'

    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupons'

    def __str__(self):
        return self.code

    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_until:
            return False
        if self.max_uses and self.used_count >= self.max_uses:
            return False
        return True


class Banner(models.Model):
    class BannerType(models.TextChoices):
        HERO = 'hero', 'Hero'
        PROMO = 'promo', 'Promotional'
        COLLECTION = 'collection', 'Collection'

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    image = models.ImageField(upload_to='banners/')
    link = models.CharField(max_length=500, blank=True)
    banner_type = models.CharField(max_length=20, choices=BannerType.choices, default=BannerType.HERO)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'banners'
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return self.title
