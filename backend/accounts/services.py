import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives, send_mail
from django.utils import timezone

User = get_user_model()


def generate_token():
    return secrets.token_urlsafe(32)


def _attach_logo(email):
    """Embed the logo so branded emails work even when remote images are blocked."""
    logo_path = settings.FRONTEND_DIST / 'logo.png'
    if logo_path.is_file():
        from email.mime.image import MIMEImage
        logo = MIMEImage(logo_path.read_bytes())
        logo.add_header('Content-ID', '<showman-logo>')
        logo.add_header('Content-Disposition', 'inline', filename='logo.png')
        email.attach(logo)


def send_verification_email(user, otp):
    subject = 'Your The Show Man verification code'
    text = f'Your verification code is {otp}. It expires in 10 minutes.'
    html = f'''<!doctype html><html><body style="margin:0;background:#f6f2f7;font-family:Arial,sans-serif;color:#2d0339">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
        <div style="padding:28px;background:#2d0339;text-align:center"><img src="cid:showman-logo" alt="The Show Man" style="width:70px;height:70px;border-radius:50%;object-fit:contain"><h1 style="margin:14px 0 0;color:#ffd700;font-size:22px;letter-spacing:3px">THE SHOW MAN</h1></div>
        <div style="padding:32px;text-align:center"><p style="font-size:17px">Your verification code</p><div style="margin:20px 0;padding:17px;background:#f8f3e7;color:#4a0560;font-size:32px;font-weight:700;letter-spacing:10px">{otp}</div><p style="color:#666;line-height:1.6">Enter this code to complete your registration. It expires in 10 minutes.</p></div>
      </div></body></html>'''
    email = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email])
    email.attach_alternative(html, 'text/html')
    _attach_logo(email)
    email.send(fail_silently=False)


def send_branded_test_email(recipient):
    """Send a real branded mail using exactly the same delivery path as OTPs."""
    text = 'SMTP is configured correctly. OTP emails can now be delivered.'
    html = '''<!doctype html><html><body style="margin:0;background:#f6f2f7;font-family:Arial,sans-serif;color:#2d0339">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
        <div style="padding:28px;background:#2d0339;text-align:center"><img src="cid:showman-logo" alt="The Show Man" style="width:70px;height:70px;border-radius:50%;object-fit:contain"><h1 style="margin:14px 0 0;color:#ffd700;font-size:22px;letter-spacing:3px">THE SHOW MAN</h1></div>
        <div style="padding:32px;text-align:center"><p style="font-size:17px">Email delivery is ready</p><p style="color:#666;line-height:1.6">This branded test confirms that verification codes can be delivered to customers.</p></div>
      </div></body></html>'''
    email = EmailMultiAlternatives('The Show Man email test', text, settings.DEFAULT_FROM_EMAIL, [recipient])
    email.attach_alternative(html, 'text/html')
    _attach_logo(email)
    email.send(fail_silently=False)


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
    EmailVerificationToken.objects.filter(user=user).delete()
    token = f'{secrets.randbelow(1_000_000):06d}'
    EmailVerificationToken.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(minutes=10),
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
