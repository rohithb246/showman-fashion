from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.models import Address, Notification, Profile, EmailVerificationToken, PasswordResetToken
from accounts.permissions import IsAdminUser, IsFullAdminUser
from accounts.serializers import (
    UserSerializer, RegisterSerializer, AddressSerializer, NotificationSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    VerifyEmailSerializer, GoogleAuthSerializer, ProfileSerializer, AdminUserUpdateSerializer,
    AdminUserCreateSerializer,
)
from accounts.services import create_verification_token, create_password_reset_token

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get('email'))
            if user.is_blocked:
                return Response({'detail': 'Account is blocked.'}, status=status.HTTP_403_FORBIDDEN)
            response.data['user'] = UserSerializer(user).data
        return response


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            create_verification_token(user)
        except Exception:
            user.delete()
            return Response(
                {'detail': 'Unable to send the verification email. Check the SMTP settings and Gmail App Password.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({
            'user': UserSerializer(user).data,
            'message': 'A verification code has been sent to your email.',
        }, status=status.HTTP_201_CREATED)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({'detail': 'Google sign-in is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token
            payload = id_token.verify_oauth2_token(
                serializer.validated_data['credential'], google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            email = payload['email'].strip().lower()
            if not payload.get('email_verified'):
                raise ValueError('Google email is not verified.')
        except (ValueError, KeyError) as exc:
            return Response({'detail': 'Invalid Google sign-in token.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            base_username = (email.split('@')[0] or 'showman')[:130]
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                suffix += 1
                username = f'{base_username[:145]}-{suffix}'
            user = User.objects.create_user(
                email=email, username=username,
                first_name=payload.get('given_name', ''), last_name=payload.get('family_name', ''),
                email_verified=True,
            )
            Profile.objects.create(user=user)
        if user.is_blocked:
            return Response({'detail': 'Account is blocked.'}, status=status.HTTP_403_FORBIDDEN)
        refresh = RefreshToken.for_user(user)
        return Response({'refresh': str(refresh), 'access': str(refresh.access_token), 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'})
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileDetailUpdateView(generics.UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        is_default = serializer.validated_data.get('is_default', False)
        if is_default or not Address.objects.filter(user=self.request.user).exists():
            Address.objects.filter(user=self.request.user).update(is_default=False)
            serializer.save(user=self.request.user, is_default=True)
        else:
            serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)
    except Notification.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'detail': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            create_password_reset_token(user)
        except User.DoesNotExist:
            pass
        return Response({'detail': 'If the email exists, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reset_token = PasswordResetToken.objects.get(
                token=serializer.validated_data['token'],
                is_used=False,
                expires_at__gt=timezone.now(),
            )
            user = reset_token.user
            user.set_password(serializer.validated_data['password'])
            user.save()
            reset_token.is_used = True
            reset_token.save()
            return Response({'detail': 'Password reset successful.'})
        except PasswordResetToken.DoesNotExist:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = EmailVerificationToken.objects.get(
                token=serializer.validated_data['token'],
                user__email=serializer.validated_data['email'],
                expires_at__gt=timezone.now(),
            )
            user = token.user
            user.email_verified = True
            user.save()
            token.delete()
            return Response({'detail': 'Email verified successfully.'})
        except EmailVerificationToken.DoesNotExist:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        try:
            user = User.objects.get(email=email, email_verified=False)
            create_verification_token(user)
        except User.DoesNotExist:
            pass
        return Response({'detail': 'If the account exists, a new code has been sent.'})


class AdminUserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsFullAdminUser]
    queryset = User.objects.all().order_by('-date_joined')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminUserCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsFullAdminUser]
    queryset = User.objects.all()

    def perform_update(self, serializer):
        serializer.save()

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)
