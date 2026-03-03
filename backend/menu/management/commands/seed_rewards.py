import os
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from menu.models import MenuItem
from reservations.models import RewardItem

class Command(BaseCommand):
    help = 'Auto-populates RewardItems based on existing MenuItems and Prices'

    def handle(self, *args, **options):
        self.stdout.write("Scanning menu items to generate rewards...")

        # 1. Define which categories are allowed to be rewards
        # Change this list if you want to include "Seafood Dishes" or "Beef" etc.
        ELIGIBLE_CATEGORIES = [
            "Dimsum", 
            "Barbecue & Appetizer", 
            "Rice & Noodles"
        ]

        # 2. Set your Point Conversion Rate
        # Example: 1 means a ₱258 Hakaw costs 258 points to redeem.
        # If you want it to cost less points, change to 0.5 (129 pts) or 10 (2580 pts).
        POINTS_MULTIPLIER = 0.5

        # Wipe existing rewards to prevent duplicates if you run this multiple times
        RewardItem.objects.all().delete()

        eligible_items = MenuItem.objects.filter(
            category__name__in=ELIGIBLE_CATEGORIES,
            is_available=True
        ).prefetch_related('prices')

        count = 0

        with transaction.atomic():
            for item in eligible_items:
                # Get all non-seasonal prices for this item
                valid_prices = item.prices.filter(is_seasonal=False, price__isnull=False)
                
                if not valid_prices.exists():
                    continue # Skip items that only have seasonal/market prices
                
                # Grab the lowest price (e.g., 'Small' or 'Regular' size)
                lowest_price = valid_prices.order_by('price').first().price
                
                # Convert Price to Points
                points_required = int(float(lowest_price) * POINTS_MULTIPLIER)

                # Create the Reward Item
                reward = RewardItem(
                    name=item.name,
                    description=item.description or f"Enjoy a complimentary {item.name}.",
                    points_required=points_required,
                    is_active=True
                )
                
                # Copy the image securely from the Menu model to the Reward model
                if item.image and getattr(item.image, 'file', None):
                    try:
                        # Open the original menu image file
                        file_content = ContentFile(item.image.read())
                        filename = os.path.basename(item.image.name)
                        
                        # Save it into the reward's upload_to path ('rewards/')
                        reward.image.save(filename, file_content, save=False)
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f"Could not copy image for {item.name}: {e}"))

                reward.save()
                count += 1
                self.stdout.write(f"  --> Created Reward: {reward.name} ({points_required} pts)")

        self.stdout.write(self.style.SUCCESS(f'Successfully populated {count} Reward Items!'))