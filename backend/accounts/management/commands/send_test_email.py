from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from accounts.services import send_branded_test_email


class Command(BaseCommand):
    help = 'Send a test email using the configured SMTP settings.'

    def add_arguments(self, parser):
        parser.add_argument('recipient', nargs='?', default=settings.EMAIL_HOST_USER)

    def handle(self, *args, **options):
        recipient = options['recipient']
        if not recipient:
            raise CommandError('Provide a recipient email address or set EMAIL_HOST_USER.')
        if settings.EMAIL_BACKEND.endswith('console.EmailBackend'):
            raise CommandError(
                'EMAIL_BACKEND is the console backend, so no real email can be sent. '
                'Set it to django.core.mail.backends.smtp.EmailBackend first.'
            )
        if settings.EMAIL_BACKEND.endswith('smtp.EmailBackend') and (
            not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD
        ):
            raise CommandError(
                'SMTP is selected but EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is missing.'
            )
        try:
            send_branded_test_email(recipient)
        except Exception as exc:
            raise CommandError(f'Email delivery failed: {exc}') from exc
        self.stdout.write(self.style.SUCCESS(f'Test email sent to {recipient}.'))
