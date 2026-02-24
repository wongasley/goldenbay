import os
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from reservations.models import DiningArea

class Command(BaseCommand):
    help = 'Seeds the database with VIP Rooms, Prices, and attaches images'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Dining Areas with Pricing and Images...")

        ROOM_IMAGES = {
            "MANILA VIP Room": "vip_manila.webp",
            "Main Dining Hall": "vip_manila.webp", 
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
        }

        # Updated descriptions based on pax and exact amenities/prices
        areas = [
            {
                "name": "Main Dining Hall", "area_type": "HALL", "capacity": 200, "price": 0, 
                "has_tv": False, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "Versatile open space perfect for casual dining and large gatherings."
            },
            {
                "name": "MANILA VIP Room", "area_type": "VIP", "capacity": 60, "price": 120000, 
                "has_tv": True, "has_ktv": True, "has_restroom": True, "has_couch": True, 
                "description": "Our grandest VIP suite, perfectly proportioned for large business meetings, corporate galas, and intimate weddings."
            },
            {
                "name": "VIP Room 1", "area_type": "VIP", "capacity": 20, "price": 40000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "A sophisticated, spacious room ideal for mid-sized family reunions or corporate gatherings."
            },
            {
                "name": "VIP Room 2", "area_type": "VIP", "capacity": 8, "price": 20000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "An intimate, exclusive setting perfect for private meetings or small family dinners."
            },
            {
                "name": "VIP Room 3", "area_type": "VIP", "capacity": 8, "price": 20000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "An intimate, exclusive setting perfect for private meetings or small family dinners."
            },
            {
                "name": "VIP Room 5", "area_type": "VIP", "capacity": 8, "price": 30000, 
                "has_tv": True, "has_ktv": False, "has_restroom": True, "has_couch": False, 
                "description": "An intimate, exclusive setting with a dedicated restroom for added privacy."
            },
            {
                "name": "VIP Room 6", "area_type": "VIP", "capacity": 20, "price": 50000, 
                "has_tv": True, "has_ktv": False, "has_restroom": True, "has_couch": False, 
                "description": "A luxurious, spacious room with a private restroom, ideal for mid-sized family reunions or corporate milestones."
            },
            {
                "name": "VIP Room 7", "area_type": "VIP", "capacity": 8, "price": 20000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "An intimate, exclusive setting perfect for private meetings or small family dinners."
            },
            {
                "name": "VIP Room 8", "area_type": "VIP", "capacity": 8, "price": 20000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "An intimate, exclusive setting perfect for private meetings or small family dinners."
            },
            {
                "name": "VIP Room 9", "area_type": "VIP", "capacity": 10, "price": 40000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "A refined, intimate space suited for private business meetings or milestone celebrations."
            },
            {
                "name": "VIP Room 10", "area_type": "VIP", "capacity": 16, "price": 40000, 
                "has_tv": True, "has_ktv": False, "has_restroom": True, "has_couch": True, 
                "description": "An elegant setting perfectly proportioned for medium-sized business meetings or family banquets."
            },
            {
                "name": "VIP Room 11", "area_type": "VIP", "capacity": 12, "price": 30000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": True, 
                "description": "A refined, intimate space with a lounge area, suited for private business meetings or milestone celebrations."
            },
            {
                "name": "VIP Room 12", "area_type": "VIP", "capacity": 12, "price": 35000, 
                "has_tv": True, "has_ktv": False, "has_restroom": False, "has_couch": False, 
                "description": "A refined, intimate space suited for private business meetings, family dinners, or milestone celebrations."
            },
            {
                "name": "VIP Room 15", "area_type": "VIP", "capacity": 12, "price": 35000, 
                "has_tv": True, "has_ktv": False, "has_restroom": True, "has_couch": True, 
                "description": "A premium space with an exclusive lounge and restroom, suited for private business meetings or milestone celebrations."
            },
        ]

        # DiningArea.objects.all().delete()
        BASE_IMAGE_PATH = os.path.join(settings.BASE_DIR, 'seed_images', 'rooms')

        for area_data in areas:
            room_name = area_data['name']
            
            area, created = DiningArea.objects.update_or_create(
                name=room_name,
                defaults={
                    'area_type': area_data['area_type'],
                    'capacity': area_data['capacity'],
                    'min_pax': 1,
                    'price': area_data['price'],
                    'description': area_data['description'],
                    'is_active': True,
                    'has_ktv': area_data['has_ktv'],
                    'has_restroom': area_data['has_restroom'],
                    'has_tv': area_data['has_tv'],
                    'has_couch': area_data['has_couch']
                }
            )

            if room_name in ROOM_IMAGES:
                filename = ROOM_IMAGES[room_name]
                file_path = os.path.join(BASE_IMAGE_PATH, filename)

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