import os
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from reservations.models import DiningArea

class Command(BaseCommand):
    help = 'Seeds the database with VIP Rooms and attaches images'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Dining Areas with Images...")

        # ---------------------------------------------------------
        # IMAGE MAPPING
        # Key = Room Name (must match exactly)
        # Value = Filename in backend/seed_images/rooms/
        # ---------------------------------------------------------
        ROOM_IMAGES = {
            "MANILA VIP Room": "vip_manila.webp",
            "Main Dining Hall": "vip_manila.webp", # Reusing Manila image if no dedicated Hall image exists, or set to None
            "VIP Room 1": "vip_1.webp",
            "VIP Room 2": "vip_2.webp",
            "VIP Room 3": "vip_3.webp",
            "VIP Room 5": "vip_5.webp",
            "VIP Room 6": "vip_6.webp",
            "VIP Room 7": "vip_7.webp",
            "VIP Room 8": "vip_8.webp",
            "VIP Room 9": "vip_9.webp",
            "VIP Room 10": "vip_10.webp",
            "VIP Room 11": "vip_11.webp",
            "VIP Room 12": "vip_12.webp",
            "VIP Room 15": "vip_15.webp",
            "VIP Room 301": "vip_301.webp",
            "VIP Room 303": "vip_303.webp",
            "VIP Room 308": "vip_308.webp",
            "VIP Room 309": "vip_309.webp",
        }

        # List of areas to create/update
        areas = [
            {"name": "Main Dining Hall", "area_type": "HALL", "capacity": 250, "min_pax": 1, "description": "Perfect for casual dining."},
            {"name": "MANILA VIP Room", "area_type": "VIP", "capacity": 60, "min_pax": 1, "description": "Intimate setting for business meetings or family dinners."},
            {"name": "VIP Room 1", "area_type": "VIP", "capacity": 20, "min_pax": 1, "description": "Private dining with exclusive service and KTV."},
            {"name": "VIP Room 2", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Private dining with exclusive service and KTV."},
            {"name": "VIP Room 3", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Spacious private room with ocean view."},
            {"name": "VIP Room 5", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Our most luxurious room for large private gatherings."},
            {"name": "VIP Room 6", "area_type": "VIP", "capacity": 24, "min_pax": 1, "description": "Intimate setting for business meetings or family dinners."},
            {"name": "VIP Room 7", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Private dining with exclusive service and KTV."},
            {"name": "VIP Room 8", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Private dining with exclusive service and KTV."},
            {"name": "VIP Room 9", "area_type": "VIP", "capacity": 20, "min_pax": 1, "description": "Spacious private room with ocean view."},
            {"name": "VIP Room 10", "area_type": "VIP", "capacity": 18, "min_pax": 1, "description": "Our most luxurious room for large private gatherings."},
            {"name": "VIP Room 11", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Intimate setting for business meetings or family dinners."},
            {"name": "VIP Room 12", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Private dining with exclusive service and KTV."},
            {"name": "VIP Room 15", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Private dining with exclusive service and KTV."},
            {"name": "VIP Room 301", "area_type": "VIP", "capacity": 20, "min_pax": 1, "description": "Spacious private room with ocean view."},
            {"name": "VIP Room 303", "area_type": "VIP", "capacity": 20, "min_pax": 1, "description": "Our most luxurious room for large private gatherings."},
            {"name": "VIP Room 308", "area_type": "VIP", "capacity": 10, "min_pax": 1, "description": "Intimate setting for business meetings or family dinners."},
            {"name": "VIP Room 309", "area_type": "VIP", "capacity": 70, "min_pax": 1, "description": "Intimate setting for business meetings or family dinners."},
        ]

        DiningArea.objects.all().delete()

        BASE_IMAGE_PATH = os.path.join(settings.BASE_DIR, 'seed_images', 'rooms')

        for area_data in areas:
            room_name = area_data['name']
            
            # Create or Get the Room
            area, created = DiningArea.objects.get_or_create(
                name=room_name,
                defaults={
                    'area_type': area_data['area_type'],
                    'capacity': area_data['capacity'],
                    'min_pax': area_data['min_pax'],
                    'description': area_data['description'],
                    'is_active': True,
                    'has_ktv': True if area_data['area_type'] == 'VIP' else False, # Default logic
                    'has_restroom': True if area_data['capacity'] > 20 else False 
                }
            )

            # Image Attachment Logic
            if room_name in ROOM_IMAGES:
                filename = ROOM_IMAGES[room_name]
                file_path = os.path.join(BASE_IMAGE_PATH, filename)

                # We attach the image if:
                # 1. It was just created OR
                # 2. It currently has no image
                if (created or not area.image) and os.path.exists(file_path):
                    self.stdout.write(f"  --> Attaching image to {room_name}: {filename}")
                    with open(file_path, 'rb') as f:
                        area.image.save(filename, File(f), save=True)
                elif not os.path.exists(file_path):
                    self.stdout.write(self.style.WARNING(f"  --> Image missing for {room_name}: {file_path}"))
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {area.name}"))
            else:
                self.stdout.write(f"Updated: {area.name}")

        self.stdout.write(self.style.SUCCESS('Dining Areas seeded successfully!'))