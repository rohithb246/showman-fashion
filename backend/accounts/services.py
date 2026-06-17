import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone

User = get_user_model()


def generate_token():
    return secrets.token_urlsafe(32)


def send_verification_email(user, token):
    verify_url = f'{settings.FRONTEND_URL}/verify-email?token={token}'
    send_mail(
        subject='Verify your email - The Show Man',
        message=f'Click the link to verify your email: {verify_url}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def send_password_reset_email(user, token):
    reset_url = f'{settings.FRONTEND_URL}/reset-password?token={token}'
    send_mail(
        subject='Reset your password - The Show Man',
        message=f'Click the link to reset your password: {reset_url}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def create_verification_token(user):
    from accounts.models import EmailVerificationToken
    token = generate_token()
    EmailVerificationToken.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(hours=24),
    )
    send_verification_email(user, token)
    return token


def create_password_reset_token(user):
    from accounts.models import PasswordResetToken
    token = generate_token()
    PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(hours=1),
    )
    send_password_reset_email(user, token)
    return token
