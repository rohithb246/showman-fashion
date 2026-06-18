from django.core.management.base import BaseCommand
from django.db.models import Count

from products.models import Inventory, ProductVariant


class Command(BaseCommand):
    help = 'Create missing inventory rows and merge duplicate inventory rows by variant.'

    def handle(self, *args, **options):
        created = 0
        duplicate_groups = 0

        for variant in ProductVariant.objects.filter(inventory__isnull=True):
            Inventory.objects.create(variant=variant, quantity=0, low_stock_threshold=5)
            created += 1

        duplicate_variant_ids = (
            Inventory.objects.values('variant_id')
            .annotate(total=Count('id'))
            .filter(total__gt=1)
        )
        for row in duplicate_variant_ids:
            items = list(Inventory.objects.filter(variant_id=row['variant_id']).order_by('-updated_at', '-id'))
            keeper = items[0]
            keeper.quantity = sum(item.quantity for item in items)
            keeper.low_stock_threshold = min(item.low_stock_threshold for item in items)
            keeper.save(update_fields=['quantity', 'low_stock_threshold'])
            Inventory.objects.filter(id__in=[item.id for item in items[1:]]).delete()
            duplicate_groups += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Inventory cleanup complete. Created {created} missing rows; '
                f'merged {duplicate_groups} duplicate variant groups.'
            )
        )
