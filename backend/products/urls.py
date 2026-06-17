from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products.views import (
    CategoryViewSet, SubCategoryViewSet, ProductViewSet, ProductImageViewSet,
    ProductVariantViewSet, SizeViewSet, ColorViewSet, InventoryViewSet,
    ReviewViewSet, CouponViewSet, BannerViewSet,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('subcategories', SubCategoryViewSet)
router.register('images', ProductImageViewSet)
router.register('variants', ProductVariantViewSet)
router.register('sizes', SizeViewSet)
router.register('colors', ColorViewSet)
router.register('inventory', InventoryViewSet)
router.register('reviews', ReviewViewSet, basename='reviews')
router.register('coupons', CouponViewSet)
router.register('banners', BannerViewSet)
router.register('', ProductViewSet, basename='products')

urlpatterns = [
    path('', include(router.urls)),
]
