from django.db import models
from django_filters import rest_framework as filters
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from accounts.permissions import IsAdminUser
from products.models import (
    Category, SubCategory, Product, ProductImage, ProductVariant,
    Size, Color, Inventory, Review, Coupon, Banner,
)
from products.serializers import (
    CategorySerializer, SubCategorySerializer, ProductListSerializer,
    ProductDetailSerializer, ProductImageSerializer, ProductVariantSerializer,
    SizeSerializer, ColorSerializer, InventorySerializer, ReviewSerializer,
    CouponSerializer, CouponValidateSerializer, BannerSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]


class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.filter(is_active=True)
    serializer_class = SubCategorySerializer
    lookup_field = 'slug'
    filterset_fields = ['category']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]


class SizeViewSet(viewsets.ModelViewSet):
    queryset = Size.objects.all()
    serializer_class = SizeSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]


class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(field_name='category__slug')
    subcategory = filters.CharFilter(field_name='subcategory__slug')
    min_price = filters.NumberFilter(field_name='base_price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='base_price', lookup_expr='lte')
    size = filters.CharFilter(method='filter_size')
    color = filters.CharFilter(method='filter_color')
    is_featured = filters.BooleanFilter()
    is_new_arrival = filters.BooleanFilter()
    is_trending = filters.BooleanFilter()

    class Meta:
        model = Product
        fields = ['category', 'subcategory', 'min_price', 'max_price', 'is_featured']

    def filter_size(self, queryset, name, value):
        return queryset.filter(variants__size__name=value, variants__is_active=True).distinct()

    def filter_color(self, queryset, name, value):
        return queryset.filter(variants__color__name=value, variants__is_active=True).distinct()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category', 'subcategory').prefetch_related('images', 'variants')
    lookup_field = 'slug'
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['base_price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        qs = Product.objects.select_related('category', 'subcategory').prefetch_related('images', 'variants', 'reviews')
        admin_mutation = (
            self.action in ['update', 'partial_update', 'destroy']
            and self.request.user.is_authenticated
            and self.request.user.is_admin_user
        )
        include_inactive = (
            self.request.query_params.get('include_inactive') == 'true'
            and self.request.user.is_authenticated
            and self.request.user.is_admin_user
        )
        if not include_inactive and not admin_mutation:
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_inactive'] = (
            self.request.query_params.get('include_inactive') == 'true'
            and self.request.user.is_authenticated
            and self.request.user.is_admin_user
        )
        return context

    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        product = self.get_object()
        related = Product.objects.filter(
            category=product.category, is_active=True
        ).exclude(id=product.id)[:8]
        serializer = ProductListSerializer(related, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def review_eligibility(self, request, slug=None):
        from orders.models import Order, OrderItem, Payment
        product = self.get_object()
        eligible = OrderItem.objects.filter(
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
        already_reviewed = Review.objects.filter(product=product, user=request.user).exists()
        return Response({
            'eligible': eligible and not already_reviewed,
            'purchased': eligible,
            'already_reviewed': already_reviewed,
        })


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['product']


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.select_related('size', 'color', 'inventory')
    serializer_class = ProductVariantSerializer
    filterset_fields = ['product']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        qs = ProductVariant.objects.select_related('product', 'size', 'color', 'inventory')
        include_inactive = (
            self.request.query_params.get('include_inactive') == 'true'
            and self.request.user.is_authenticated
            and self.request.user.is_admin_user
        )
        if not include_inactive:
            qs = qs.filter(is_active=True, product__is_active=True)
        return qs

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_create(self, request):
        product_id = request.data.get('product_id')
        size_ids = request.data.get('size_ids') or []
        color_ids = request.data.get('color_ids') or []
        try:
            quantity = max(0, int(request.data.get('quantity', 0)))
            threshold = max(0, int(request.data.get('low_stock_threshold', 5)))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Quantity and low-stock threshold must be valid numbers.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not product_id or not size_ids or not color_ids:
            return Response(
                {'detail': 'Select a product, at least one size, and at least one color.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        sizes = {str(item.id): item for item in Size.objects.filter(id__in=size_ids)}
        colors = {str(item.id): item for item in Color.objects.filter(id__in=color_ids)}
        created = 0
        updated = 0

        for size_id in size_ids:
            for color_id in color_ids:
                size_obj = sizes.get(str(size_id))
                color_obj = colors.get(str(color_id))
                if not size_obj or not color_obj:
                    continue
                sku = f'{product.slug}-{size_obj.name}-{color_obj.name}'.upper()
                sku = ''.join(char if char.isalnum() else '-' for char in sku)
                sku = '-'.join(filter(None, sku.split('-')))[:50]
                variant, was_created = ProductVariant.objects.get_or_create(
                    product=product,
                    size=size_obj,
                    color=color_obj,
                    defaults={'sku': sku, 'is_active': True},
                )
                if not variant.is_active:
                    variant.is_active = True
                    variant.save(update_fields=['is_active'])
                inventory, _ = Inventory.objects.get_or_create(variant=variant)
                inventory.quantity = quantity
                inventory.low_stock_threshold = threshold
                inventory.save(update_fields=['quantity', 'low_stock_threshold'])
                if was_created:
                    created += 1
                else:
                    updated += 1

        return Response({'created': created, 'updated': updated}, status=status.HTTP_201_CREATED)


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.select_related('variant')
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        # An inventory row represents one complete size/color option. Removing it
        # from inventory should remove that option everywhere, not leave a broken
        # variant without stock data.
        instance.variant.delete()

    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        created = 0
        duplicate_groups = 0

        for variant in ProductVariant.objects.filter(inventory__isnull=True):
            Inventory.objects.create(variant=variant, quantity=0, low_stock_threshold=5)
            created += 1

        # The model enforces one inventory row per variant, but this also repairs
        # databases that were edited manually before the constraint existed.
        duplicate_variant_ids = (
            Inventory.objects.values('variant_id')
            .annotate(total=models.Count('id'))
            .filter(total__gt=1)
        )
        for row in duplicate_variant_ids:
            items = list(Inventory.objects.filter(variant_id=row['variant_id']).order_by('-updated_at', '-id'))
            keeper = items[0]
            keeper.quantity = sum(item.quantity for item in items)
            keeper.low_stock_threshold = min(item.low_stock_threshold for item in items)
            keeper.save(update_fields=['quantity', 'low_stock_threshold'])
            Inventory.objects.filter(id__in=[item.id for item in items[1:]]).delete()
            duplicate_groups += 1

        return Response({
            'created_missing_inventory': created,
            'deduplicated_variant_groups': duplicate_groups,
        })

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        items = self.queryset.filter(quantity__lte=models.F('low_stock_threshold'))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filterset_fields = ['product', 'is_approved']

    def get_queryset(self):
        qs = Review.objects.select_related('user', 'product')
        if self.request.user.is_authenticated and self.request.user.is_admin_user:
            return qs
        return qs.filter(is_approved=True)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'approve', 'reject']:
            return [IsAdminUser()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        review = self.get_object()
        review.is_approved = True
        review.save()
        return Response(ReviewSerializer(review).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        review = self.get_object()
        review.is_approved = False
        review.save(update_fields=['is_approved'])
        return Response(ReviewSerializer(review).data)


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_admin_user:
            return Coupon.objects.all().order_by('-valid_until')
        return Coupon.objects.filter(is_active=True).order_by('-valid_until')

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def current(self, request):
        now = timezone.now()
        coupon = Coupon.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_until__gte=now,
        ).exclude(
            max_uses__isnull=False,
            used_count__gte=models.F('max_uses'),
        ).order_by('-valid_from', '-id').first()
        if not coupon:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(CouponSerializer(coupon).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def validate(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            coupon = Coupon.objects.get(code=serializer.validated_data['code'].upper())
            if coupon.is_valid():
                return Response(CouponSerializer(coupon).data)
            return Response({'detail': 'Coupon is expired or inactive.'}, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response({'detail': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.filter(is_active=True).order_by('sort_order')
    serializer_class = BannerSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_admin_user:
            return Banner.objects.all().order_by('sort_order')
        return Banner.objects.filter(is_active=True).order_by('sort_order')
