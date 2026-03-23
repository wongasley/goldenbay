from django.core.management.base import BaseCommand
from django.db import transaction
from inventory.models import Location, Product, StockLevel

class Command(BaseCommand):
    help = 'Seeds the database with Inventory Locations, Products, and Initial Stock'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Inventory System...")

        with transaction.atomic():
            # 1. Create Locations (Storages vs Departments)
            storages = [
                "Main Commissary (Ground Floor)",
                "4th Floor Dry Storage",
                "Walk-in Freezer 1",
            ]
            departments = [
                "Main Kitchen",
                "Dimsum Kitchen",
                "Bar & Beverage",
            ]

            storage_locs = []
            for name in storages:
                loc, _ = Location.objects.get_or_create(name=name, defaults={'is_storage': True, 'is_department': False})
                storage_locs.append(loc)

            dept_locs = []
            for name in departments:
                loc, _ = Location.objects.get_or_create(name=name, defaults={'is_storage': False, 'is_department': True})
                dept_locs.append(loc)

            # 2. Create Products
            products_data = [
                {
                    "name": "Premium Light Soy Sauce", "brand": "Lee Kum Kee", 
                    "base_unit": "Bottle", "units_per_box": 12, 
                    "barcode": "SOY-123-BOT", "box_barcode": "SOY-123-BOX", "cost_price": 150.00
                },
                {
                    "name": "Jasmine Tea Leaves", "brand": "Ten Fu", 
                    "base_unit": "Pack", "units_per_box": 50, 
                    "barcode": "TEA-456-PCK", "box_barcode": "TEA-456-BOX", "cost_price": 45.00
                },
                {
                    "name": "Heineken Beer (330ml)", "brand": "Heineken", 
                    "base_unit": "Can", "units_per_box": 24, 
                    "barcode": "BEER-789-CAN", "box_barcode": "BEER-789-BOX", "cost_price": 80.00
                },
                {
                    "name": "Black Truffle Paste", "brand": "Urbani", 
                    "base_unit": "Jar", "units_per_box": 6, 
                    "barcode": "TRUF-001-JAR", "box_barcode": "TRUF-001-BOX", "cost_price": 1200.00
                },
            ]

            created_products = []
            for p_data in products_data:
                prod, _ = Product.objects.get_or_create(
                    barcode=p_data['barcode'],
                    defaults=p_data
                )
                created_products.append(prod)

            # 3. Add Initial Stock to the Main Commissary so you have something to transfer
            main_storage = storage_locs[0]
            for prod in created_products:
                StockLevel.objects.get_or_create(
                    product=prod,
                    location=main_storage,
                    defaults={'quantity': prod.units_per_box * 10} # 10 boxes of everything
                )

        self.stdout.write(self.style.SUCCESS('Inventory Seeded Successfully!'))
        self.stdout.write("Run: python manage.py seed_inventory")