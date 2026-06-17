from django.db import models
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminUser
from accounts.models import User
from products.models import Product, Inventory
from orders.models import Order, Payment
from core.models import ContactMessage, AdminLog


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_users = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_orders = Order.objects.count()
        total_products = Product.objects.filter(is_active=True).count()
        revenue = Payment.objects.filter(status=Payment.Status.SUCCESS).aggregate(
            total=Sum('amount')
        )['total'] or 0

        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        recent_orders_data = [{
            'id': o.id,
            'order_number': o.order_number,
            'user': o.user.email,
            'total': str(o.total),
            'status': o.status,
            'created_at': o.created_at.isoformat(),
        } for o in recent_orders]

        six_months_ago = timezone.now() - timedelta(days=180)
        sales_by_month = (
            Payment.objects.filter(
                status=Payment.Status.SUCCESS,
                created_at__gte=six_months_ago,
            )
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('amount'), orders=Count('id'))
            .order_by('month')
        )
        sales_analytics = [{
            'month': item['month'].strftime('%Y-%m') if item['month'] else '',
            'revenue': float(item['revenue'] or 0),
            'orders': item['orders'],
        } for item in sales_by_month]

        low_stock = Inventory.objects.filter(
            quantity__lte=models.F('low_stock_threshold')
        ).count()

        pending_contacts = ContactMessage.objects.filter(status=ContactMessage.Status.NEW).count()

        return Response({
            'total_users': total_users,
            'total_orders': total_orders,
            'total_products': total_products,
            'total_revenue': float(revenue),
            'recent_orders': recent_orders_data,
            'sales_analytics': sales_analytics,
            'low_stock_count': low_stock,
            'pending_contacts': pending_contacts,
        })


class AdminLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        logs = AdminLog.objects.select_related('admin').order_by('-created_at')[:50]
        return Response([{
            'id': log.id,
            'admin': log.admin.email if log.admin else None,
            'action': log.action,
            'model_name': log.model_name,
            'object_id': log.object_id,
            'details': log.details,
            'created_at': log.created_at.isoformat(),
        } for log in logs])
