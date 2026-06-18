from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser
from core.models import ContactMessage, AdminLog
from core.serializers import ContactMessageSerializer, ContactAdminSerializer


class ContactCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class ContactAdminListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactAdminSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['status']


class ContactAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactAdminSerializer
    permission_classes = [IsAdminUser]


def log_admin_action(admin, action, model_name, object_id='', details=None, ip=None):
    AdminLog.objects.create(
        admin=admin,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        details=details or {},
        ip_address=ip,
    )
