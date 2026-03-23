from django.core.management.base import BaseCommand
from django.db import transaction
from inventory.models import Location, Rack, Product, StockLevel

class Command(BaseCommand):
    help = 'Seeds the database with Inventory Locations, Racks, Products, and Initial Stock'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Inventory System...")

        with transaction.atomic():
            # 1. Create Locations
            storages = ["Main Commissary (Ground Floor)", "4th Floor Dry Storage", "Walk-in Freezer 1"]
            departments = ["Main Kitchen", "Dimsum Kitchen", "Bar & Beverage"]

            storage_locs = {}
            for name in storages:
                loc, _ = Location.objects.get_or_create(name=name, defaults={'is_storage': True, 'is_department': False})
                storage_locs[name] = loc

            for name in departments:
                Location.objects.get_or_create(name=name, defaults={'is_storage': False, 'is_department': True})

            # 2. Create Multiple Racks for Storages
            rack_configs = {
                "Main Commissary (Ground Floor)": ["Rack 1", "Rack 2", "Rack 3", "Receiving Pallet"],
                "4th Floor Dry Storage": ["Aisle A", "Aisle B", "Aisle C"],
                "Walk-in Freezer 1": ["Shelf 1", "Shelf 2", "Shelf 3"]
            }

            all_racks = {}
            for loc_name, racks in rack_configs.items():
                loc = storage_locs[loc_name]
                for rack_name in racks:
                    rack, _ = Rack.objects.get_or_create(location=loc, name=rack_name)
                    # Save a reference to the rack so we can easily put stock on it later
                    all_racks[f"{loc_name}-{rack_name}"] = rack

            # 3. Create Products
            products_data = [
                {"name": "Premium Light Soy Sauce", "brand": "Lee Kum Kee", "base_unit": "Bottle", "units_per_box": 12, "barcode": "SOY-123-BOT", "box_barcode": "SOY-123-BOX", "cost_price": 150.00},
                {"name": "Jasmine Tea Leaves", "brand": "Ten Fu", "base_unit": "Pack", "units_per_box": 50, "barcode": "TEA-456-PCK", "box_barcode": "TEA-456-BOX", "cost_price": 45.00},
                {"name": "Heineken Beer (330ml)", "brand": "Heineken", "base_unit": "Can", "units_per_box": 24, "barcode": "BEER-789-CAN", "box_barcode": "BEER-789-BOX", "cost_price": 80.00},
                {"name": "Black Truffle Paste", "brand": "Urbani", "base_unit": "Jar", "units_per_box": 6, "barcode": "TRUF-001-JAR", "box_barcode": "TRUF-001-BOX", "cost_price": 1200.00},
            ]

            created_products = {}
            for p_data in products_data:
                prod, _ = Product.objects.get_or_create(barcode=p_data['barcode'], defaults=p_data)
                created_products[prod.barcode] = prod

            # 4. Distribute Initial Stock Across Different Racks
            stock_distribution = [
                # Soy Sauce -> Main Commissary, Rack 1
                (created_products["SOY-123-BOT"], storage_locs["Main Commissary (Ground Floor)"], all_racks["Main Commissary (Ground Floor)-Rack 1"], 120),
                
                # Tea Leaves -> 4th Floor, Aisle A
                (created_products["TEA-456-PCK"], storage_locs["4th Floor Dry Storage"], all_racks["4th Floor Dry Storage-Aisle A"], 500),
                
                # Beer -> Main Commissary, Rack 2
                (created_products["BEER-789-CAN"], storage_locs["Main Commissary (Ground Floor)"], all_racks["Main Commissary (Ground Floor)-Rack 2"], 240),
                
                # Truffle Paste -> Freezer, Shelf 1
                (created_products["TRUF-001-JAR"], storage_locs["Walk-in Freezer 1"], all_racks["Walk-in Freezer 1-Shelf 1"], 60),
            ]

            for prod, loc, rack, qty in stock_distribution:
                # Using update_or_create so if you run this twice, it resets the quantities safely
                StockLevel.objects.update_or_create(
                    product=prod,
                    location=loc,
                    rack=rack,
                    defaults={'quantity': qty} 
                )

        self.stdout.write(self.style.SUCCESS('Inventory Seeded Successfully with Racks!'))