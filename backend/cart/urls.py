from django.urls import path
from cart.views import CartView, CartItemView, ApplyCouponView, WishlistView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('items/', CartItemView.as_view(), name='cart_items'),
    path('items/<int:item_id>/', CartItemView.as_view(), name='cart_item_detail'),
    path('apply-coupon/', ApplyCouponView.as_view(), name='apply_coupon'),
    path('wishlist/', WishlistView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/', WishlistView.as_view(), name='wishlist_remove'),
]
