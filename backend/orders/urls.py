from django.urls import path, include
from rest_framework.routers import DefaultRouter
from orders.views import CheckoutView, OrderViewSet, PaymentConfirmView, PaymentConfigView

router = DefaultRouter()
router.register('', OrderViewSet, basename='orders')

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('payment/confirm/', PaymentConfirmView.as_view(), name='payment_confirm'),
    path('payment/config/', PaymentConfigView.as_view(), name='payment_config'),
    path('', include(router.urls)),
]
