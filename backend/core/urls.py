from django.urls import path
from core.views import ContactCreateView, ContactAdminListView, ContactAdminDetailView

urlpatterns = [
    path('contact/', ContactCreateView.as_view(), name='contact'),
    path('admin/contacts/', ContactAdminListView.as_view(), name='admin_contacts'),
    path('admin/contacts/<int:pk>/', ContactAdminDetailView.as_view(), name='admin_contact_detail'),
]
