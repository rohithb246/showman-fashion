from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser
from core.models import ContactMessage, NewsletterSubscriber, AdminLog
from core.serializers import ContactMessageSerializer, ContactAdminSerializer, NewsletterSubscriberSerializer


class ContactCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class NewsletterSubscribeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = NewsletterSubscriberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].lower()
        subscriber, created = NewsletterSubscriber.objects.get_or_create(email=email)
        if not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save(update_fields=['is_active'])
            created = True
        return Response(
            {'detail': 'You are subscribed to new-item alerts.'},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class PublicConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'google_client_id': settings.GOOGLE_CLIENT_ID})


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


def serve_frontend(request, path=''):
    """Serve the bundled React application from the single Render service."""
    frontend_root = settings.FRONTEND_DIST.resolve()
    requested_file = (frontend_root / path).resolve()

    if requested_file.is_relative_to(frontend_root) and requested_file.is_file():
        return FileResponse(requested_file.open('rb'))

    index_file = frontend_root / 'index.html'
    if not index_file.is_file():
        raise Http404('Frontend build is not available.')
    return FileResponse(index_file.open('rb'))
