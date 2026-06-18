from rest_framework import serializers
from products.models import (
    Category, SubCategory, Product, ProductImage, ProductVariant,
    Size, Color, Inventory, Review, Coupon, Banner,
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'display_image',
            'is_active', 'product_count',
        ]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_display_image(self, obj):
        image = obj.image
        if not image:
            product = obj.products.filter(is_active=True, images__isnull=False).distinct().first()
            if product:
                product_image = product.images.filter(is_primary=True).first() or product.images.first()
                image = product_image.image if product_image else None
        if not image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(image.url) if request else image.url


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'category', 'name', 'slug', 'description', 'is_active']


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name', 'sort_order']


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name', 'hex_code']


class ProductImageSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = ProductImage
        fields = ['id', 'product_id', 'image', 'alt_text', 'is_primary', 'sort_order']


class InventorySerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source='variant.sku', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    size_name = serializers.CharField(source='variant.size.name', read_only=True)
    color_name = serializers.CharField(source='variant.color.name', read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 'variant', 'variant_sku', 'product_name', 'size_name', 'color_name',
            'quantity', 'low_stock_threshold', 'is_low_stock', 'in_stock',
        ]
        read_only_fields = ['is_low_stock', 'in_stock']


class ProductVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=Size.objects.all(), source='size', write_only=True
    )
    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(), source='color', write_only=True
    )
    inventory = InventorySerializer(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product_id', 'size', 'color', 'size_id', 'color_id', 'sku',
            'product_name', 'price_adjustment', 'price', 'is_active', 'inventory',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand_name', 'base_price', 'sale_price', 'effective_price',
            'primary_image', 'is_featured', 'is_new_arrival', 'is_trending',
            'is_active', 'average_rating', 'review_count', 'category_name', 'variants',
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None

    def get_variants(self, obj):
        variants = obj.variants.select_related('size', 'color', 'inventory').filter(is_active=True)
        if not self.context.get('include_inactive'):
            variants = variants.filter(product__is_active=True)
        return ProductVariantSerializer(variants, many=True, context=self.context).data


class ProductDetailSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    subcategory = SubCategorySerializer(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    subcategory_id = serializers.PrimaryKeyRelatedField(
        queryset=SubCategory.objects.all(), source='subcategory', write_only=True, required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand_name', 'description', 'specifications',
            'category', 'subcategory', 'category_id', 'subcategory_id',
            'base_price', 'sale_price', 'effective_price',
            'is_featured', 'is_new_arrival', 'is_trending', 'is_active',
            'images', 'variants', 'average_rating', 'review_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def _is_admin_request(self):
        request = self.context.get('request')
        return bool(
            request
            and request.user.is_authenticated
            and getattr(request.user, 'is_admin_user', False)
        )

    def get_images(self, obj):
        return ProductImageSerializer(obj.images.all(), many=True, context=self.context).data

    def get_variants(self, obj):
        variants = obj.variants.select_related('size', 'color', 'inventory')
        if not self._is_admin_request():
            variants = variants.filter(is_active=True)
        return ProductVariantSerializer(variants, many=True, context=self.context).data

    def validate(self, attrs):
        category = attrs.get('category', getattr(self.instance, 'category', None))
        subcategory = attrs.get('subcategory', getattr(self.instance, 'subcategory', None))
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError({
                'subcategory_id': 'Choose a subcategory from the selected category.'
            })
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user', 'user_name', 'rating', 'title',
            'comment', 'is_approved', 'created_at',
        ]
        read_only_fields = ['user', 'is_approved', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def validate_product(self, product):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return product
        from orders.models import Order, OrderItem, Payment
        purchased = OrderItem.objects.filter(
            order__user=request.user,
            variant__product=product,
            order__status__in=[
                Order.Status.CONFIRMED,
                Order.Status.PROCESSING,
                Order.Status.SHIPPED,
                Order.Status.DELIVERED,
            ],
            order__payment__status=Payment.Status.SUCCESS,
        ).exists()
        if not purchased:
            raise serializers.ValidationError('Only customers who purchased this product can review it.')
        return product


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_order_amount', 'max_uses', 'used_count', 'is_active',
            'valid_from', 'valid_until',
        ]

    def validate(self, attrs):
        valid_from = attrs.get('valid_from', getattr(self.instance, 'valid_from', None))
        valid_until = attrs.get('valid_until', getattr(self.instance, 'valid_until', None))
        discount_type = attrs.get('discount_type', getattr(self.instance, 'discount_type', None))
        discount_value = attrs.get('discount_value', getattr(self.instance, 'discount_value', None))
        if valid_from and valid_until and valid_until <= valid_from:
            raise serializers.ValidationError({'valid_until': 'Valid until must be after valid from.'})
        if discount_type == Coupon.DiscountType.PERCENTAGE and discount_value and discount_value > 100:
            raise serializers.ValidationError({'discount_value': 'Percentage discount cannot exceed 100.'})
        return attrs


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = [
            'id', 'title', 'subtitle', 'image', 'link',
            'banner_type', 'is_active', 'sort_order',
        ]
