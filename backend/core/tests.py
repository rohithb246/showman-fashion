from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from core.models import ContactMessage


User = get_user_model()


class ContactAdminTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='contact-admin',
            email='contact-admin@example.com',
            password='password123',
            role=User.Role.ADMIN,
        )
        self.contact = ContactMessage.objects.create(
            name='Customer',
            email='customer@example.com',
            subject='Question',
            message='Please help.',
        )
        self.client.force_authenticate(self.admin)

    def test_admin_can_update_status_and_notes(self):
        response = self.client.patch(
            f'/api/core/admin/contacts/{self.contact.id}/',
            {'status': 'resolved', 'admin_notes': 'Answered by phone.'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.contact.refresh_from_db()
        self.assertEqual(self.contact.status, ContactMessage.Status.RESOLVED)
        self.assertEqual(self.contact.admin_notes, 'Answered by phone.')

    def test_admin_can_delete_contact(self):
        response = self.client.delete(f'/api/core/admin/contacts/{self.contact.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(ContactMessage.objects.filter(id=self.contact.id).exists())
