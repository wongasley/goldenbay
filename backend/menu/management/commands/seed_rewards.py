import os
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from menu.models import MenuItem
from reservations.models import RewardItem

class Command(BaseCommand):
    help = 'Populates rewards for EVERY size of eligible menu items (Option B & C)'

    def handle(self, *args, **options):
        self.stdout.write("Generating multi-size Reward Catalog...")

        ELIGIBLE_CATEGORIES = ["Dimsum", "Barbecue & Appetizer", "Rice & Noodles"]
        POINTS_MULTIPLIER = 0.5 # 1 Point = 2 Pesos value

        RewardItem.objects.all().delete()

        items = MenuItem.objects.filter(
            category__name__in=ELIGIBLE_CATEGORIES,
            is_available=True
        ).prefetch_related('prices')

        count = 0
        with transaction.atomic():
            for item in items:
                # Loop through EVERY price option for this dish
                for price_obj in item.prices.filter(is_seasonal=False, price__isnull=False):
                    
                    points_required = int(float(price_obj.price) * POINTS_MULTIPLIER)
                    
                    # Create a specific reward for this name + size combo
                    reward = RewardItem(
                        name=item.name,
                        size=price_obj.size, # Save the size (S, M, L, etc.)
                        description=item.description or f"Enjoy a {price_obj.size} serving of our {item.name}.",
                        points_required=points_required,
                        is_active=True
                    )
                    
                    # Copy Image
                    if item.image:
                        try:
                            file_content = ContentFile(item.image.read())
                            filename = os.path.basename(item.image.name)
                            reward.image.save(filename, file_content, save=False)
                        except:
                            pass

                    reward.save()
                    count += 1
                    self.stdout.write(f"  --> Created: {item.name} [{price_obj.size}] | {points_required} pts")

        self.stdout.write(self.style.SUCCESS(f'Done! Created {count} total reward options.'))