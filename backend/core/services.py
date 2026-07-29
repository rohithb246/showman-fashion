from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from core.models import NewsletterSubscriber


def send_new_arrival_alerts(product):
    """Notify opted-in subscribers when an admin publishes a new arrival."""
    recipients = list(NewsletterSubscriber.objects.filter(is_active=True).values_list('email', flat=True))
    if not recipients:
        return
    product_url = f'{settings.FRONTEND_URL}/product/{product.slug}'
    subject = f'New arrival: {product.name} | The Show Man'
    text = f'A new item has arrived: {product.name}. Shop it now: {product_url}'
    html = f'''<div style="font-family:Arial,sans-serif;color:#2d0339;max-width:560px;margin:auto">
      <div style="background:#2d0339;padding:24px;text-align:center;color:#ffd700"><b style="letter-spacing:3px">THE SHOW MAN</b></div>
      <div style="padding:28px"><h2>New arrival: {product.name}</h2><p>Be among the first to discover our newest collection piece.</p>
      <p><a href="{product_url}" style="display:inline-block;background:#4a0560;color:#ffd700;padding:12px 18px;text-decoration:none;border-radius:6px">Shop now</a></p></div></div>'''
    email = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, recipients)
    email.attach_alternative(html, 'text/html')
    email.send(fail_silently=True)
