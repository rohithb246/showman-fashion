from django.urls import path
from admin_panel.views import DashboardView, AdminLogsView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='admin_dashboard'),
    path('logs/', AdminLogsView.as_view(), name='admin_logs'),
]
