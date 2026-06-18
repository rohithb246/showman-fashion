from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser
from orders.models import Order
from orders.serializers import OrderSerializer, CreateOrderSerializer
from orders.services import process_checkout, confirm_payment, get_payment_config, restore_order_inventory


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order = process_checkout(request.user, serializer.validated_data)
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin_user:
            return Order.objects.prefetch_related('items', 'payment').all()
        return Order.objects.prefetch_related('items', 'payment').filter(user=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in Order.Status.values:
            if new_status == Order.Status.CANCELLED and order.status != Order.Status.CANCELLED:
                restore_order_inventory(order)
            order.status = new_status
            if request.data.get('tracking_number'):
                order.tracking_number = request.data['tracking_number']
            order.save()
            return Response(OrderSerializer(order).data)
        return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.user != request.user and not request.user.is_admin_user:
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in [Order.Status.PENDING, Order.Status.CONFIRMED]:
            return Response({'detail': 'Cannot cancel this order.'}, status=status.HTTP_400_BAD_REQUEST)
        restore_order_inventory(order)
        order.status = Order.Status.CANCELLED
        order.save()
        return Response(OrderSerializer(order).data)


class PaymentConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_number = request.data.get('order_number')
        try:
            order = confirm_payment(
                request.user,
                order_number,
                request.data,
            )
            return Response({'detail': 'Payment successful.', 'order': OrderSerializer(order).data})
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_payment_config())
