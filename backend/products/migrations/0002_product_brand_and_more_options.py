from django.db import migrations, models


def add_default_options(apps, schema_editor):
    Size = apps.get_model('products', 'Size')
    Color = apps.get_model('products', 'Color')

    sizes = [
        ('Free Size', 0),
        ('30', 30),
        ('32', 32),
        ('34', 34),
        ('36', 36),
        ('38', 38),
        ('40', 40),
        ('42', 42),
        ('44', 44),
        ('6', 60),
        ('7', 70),
        ('8', 80),
        ('9', 90),
        ('10', 100),
        ('11', 110),
        ('12', 120),
    ]
    for name, sort_order in sizes:
        Size.objects.get_or_create(name=name, defaults={'sort_order': sort_order})

    colors = [
        ('Charcoal', '#36454F'),
        ('Ivory', '#FFFFF0'),
        ('Silver', '#C0C0C0'),
        ('Champagne', '#F7E7CE'),
        ('Emerald', '#046307'),
        ('Royal Blue', '#4169E1'),
        ('Brown', '#5C4033'),
        ('Tan', '#D2B48C'),
        ('Maroon', '#800000'),
        ('Red', '#D90429'),
        ('Beige', '#F5F5DC'),
        ('Grey', '#808080'),
    ]
    for name, hex_code in colors:
        Color.objects.get_or_create(name=name, defaults={'hex_code': hex_code})


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='brand_name',
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.RunPython(add_default_options, migrations.RunPython.noop),
    ]
