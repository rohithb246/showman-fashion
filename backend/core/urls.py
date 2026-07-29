from django.urls import path
from core.views import ContactCreateView, NewsletterSubscribeView, PublicConfigView, ContactAdminListView, ContactAdminDetailView

urlpatterns = [
    path('contact/', ContactCreateView.as_view(), name='contact'),
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view(), name='newsletter_subscribe'),
    path('config/', PublicConfigView.as_view(), name='public_config'),
    path('admin/contacts/', ContactAdminListView.as_view(), name='admin_contacts'),
    path('admin/contacts/<int:pk>/', ContactAdminDetailView.as_view(), name='admin_contact_detail'),
]
