from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_default_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    admin, _ = User.objects.get_or_create(
        email='admin@theshowman.com',
        defaults={'username': 'admin'},
    )
    admin.username = 'admin'
    admin.first_name = 'Show'
    admin.last_name = 'Admin'
    admin.role = 'admin'
    admin.is_staff = True
    admin.is_superuser = True
    admin.is_active = True
    admin.email_verified = True
    admin.password = make_password('admin123')
    admin.save()


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_admin, migrations.RunPython.noop),
    ]
