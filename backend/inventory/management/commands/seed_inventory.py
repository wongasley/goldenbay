from django.core.management.base import BaseCommand
from django.db import transaction
from inventory.models import Location, Rack, Product, StockLevel

class Command(BaseCommand):
    help = 'Seeds the database with Inventory Locations, Racks, Products, and Initial Stock'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Inventory System...")

        with transaction.atomic():
            # 1. Create ALL Locations
            all_locations = [
                "DRY STORAGE", "FREEZER 1 (GROUND)", "KITCHEN", "BAR", "PANTRY", 
                "ROASTING", "DIMSUM", "FREEZER (2ND FLOOR)", "DINING HALL", 
                "MANILA VIP Room", "VIP Room 1", "VIP Room 2", "VIP Room 3", 
                "VIP Room 5", "VIP Room 6", "VIP Room 7", "VIP Room 8", 
                "VIP Room 9", "VIP Room 10", "VIP Room 11", "VIP Room 12", 
                "VIP Room 15", "BANQUET HALL", "4TH FLOOR STOCK ROOM", "2ND FLOOR STOCK ROOM"
            ]

            loc_objects = {}
            for name in all_locations:
                loc, _ = Location.objects.get_or_create(name=name)
                loc_objects[name] = loc

            # 2. Create Specific Racks for specific storages
            rack_configs = {
                "DRY STORAGE": ["Rack 1", "Rack 2", "Rack 3", "Pallet Area"],
                "4TH FLOOR STOCK ROOM": ["Aisle A", "Aisle B", "Aisle C"],
                "2ND FLOOR STOCK ROOM": ["Shelf 1", "Shelf 2", "Shelf 3"],
                "FREEZER 1 (GROUND)": ["Meat Shelf", "Seafood Shelf", "Veggie Shelf"],
                "BAR": ["Liquor Cabinet", "Under Counter", "Wine Display"]
            }

            # Create specific racks
            for loc_name, racks in rack_configs.items():
                loc = loc_objects[loc_name]
                for rack_name in racks:
                    Rack.objects.get_or_create(location=loc, name=rack_name)

            # Create a "Main Station" default rack for all other rooms (like VIP rooms, Kitchen, etc.)
            for name, loc in loc_objects.items():
                if name not in rack_configs:
                    Rack.objects.get_or_create(location=loc, name="Main Station")

            # 3. Create Products
            products_data = [
                {"name": "Premium Light Soy Sauce", "brand": "Lee Kum Kee", "base_unit": "Bottle", "units_per_box": 12, "barcode": "SOY-123-BOT", "box_barcode": "SOY-123-BOX", "cost_price": 150.00},
                {"name": "Jasmine Tea Leaves", "brand": "Ten Fu", "base_unit": "Pack", "units_per_box": 50, "barcode": "TEA-456-PCK", "box_barcode": "TEA-456-BOX", "cost_price": 45.00},
                {"name": "Heineken Beer (330ml)", "brand": "Heineken", "base_unit": "Can", "units_per_box": 24, "barcode": "BEER-789-CAN", "box_barcode": "BEER-789-BOX", "cost_price": 80.00},
            ]

            for p_data in products_data:
                Product.objects.get_or_create(barcode=p_data['barcode'], defaults=p_data)

        self.stdout.write(self.style.SUCCESS('Locations & Racks Seeded Successfully!'))