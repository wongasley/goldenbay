from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from rest_framework.exceptions import ValidationError

class UnitOfMeasure(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text="e.g., Kilogram, Liter, Box, Piece")
    abbreviation = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return self.name
    
class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # REMOVED is_storage and is_department. Everything is a storage location now!

    def __str__(self):
        return self.name

class Rack(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='racks')
    name = models.CharField(max_length=50, help_text="e.g., Rack 1, Shelf A, Bar Cabinet")

    class Meta:
        unique_together = ('location', 'name')
        ordering = ['location__name', 'name']

    def __str__(self):
        return f"{self.location.name} - {self.name}"

class Product(models.Model):
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    barcode = models.CharField(max_length=100, unique=True, db_index=True)
    box_barcode = models.CharField(max_length=100, blank=True, null=True)
    
    base_unit = models.CharField(max_length=50, default='Bottle')
    units_per_box = models.IntegerField(default=1)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.brand} {self.name}" if self.brand else self.name

class StockLevel(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_levels')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='inventory')
    rack = models.ForeignKey(Rack, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_levels')
    quantity = models.IntegerField(default=0, help_text="Tracked in base units")

    class Meta:
        unique_together = ('product', 'location', 'rack')
        
    def __str__(self):
        rack_info = f" ({self.rack.name})" if self.rack else ""
        return f"{self.product.name} @ {self.location.name}{rack_info}: {self.quantity}"

class InventoryDocument(models.Model):
    DOC_TYPES = [
        ('INBOUND', 'Inbound Delivery (From Supplier)'),
        ('TRANSFER', 'Internal Transfer (Loc to Loc)'),
        ('OUTBOUND', 'Outbound (Consumed / Wasted)'),
    ]
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved / Completed'),
        ('REJECTED', 'Rejected')
    ]

    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    source_location = models.ForeignKey(Location, related_name='outgoing_docs', on_delete=models.SET_NULL, null=True, blank=True)
    source_rack = models.ForeignKey(Rack, related_name='outgoing_rack_docs', on_delete=models.SET_NULL, null=True, blank=True)
    
    destination_location = models.ForeignKey(Location, related_name='incoming_docs', on_delete=models.SET_NULL, null=True, blank=True)
    destination_rack = models.ForeignKey(Rack, related_name='incoming_rack_docs', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_docs')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_docs')
    
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.doc_type} #{self.id} - {self.status}"

class DocumentLineItem(models.Model):
    document = models.ForeignKey(InventoryDocument, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(help_text="Total base units")

# --- UPDATED LOGIC: Accurate Rack-to-Rack Stock Movement ---
@receiver(post_save, sender=InventoryDocument)
def process_inventory_movement(sender, instance, **kwargs):
    if instance.status == 'APPROVED':
        with transaction.atomic():
            for line in instance.items.all():
                
                # Deduct from Source (Transfers & Outbound Consumption)
                if instance.doc_type in ['TRANSFER', 'OUTBOUND'] and instance.source_location:
                    source_stock, _ = StockLevel.objects.get_or_create(
                        product=line.product, location=instance.source_location, rack=instance.source_rack
                    )
                    if source_stock.quantity < line.quantity:
                        raise ValidationError(f"Insufficient stock for {line.product.name} in {instance.source_location.name} ({instance.source_rack.name if instance.source_rack else 'No Rack'})")
                    
                    source_stock.quantity -= line.quantity
                    source_stock.save()

                # Add to Destination (Inbound Deliveries & Transfers)
                if instance.doc_type in ['INBOUND', 'TRANSFER'] and instance.destination_location:
                    dest_stock, _ = StockLevel.objects.get_or_create(
                        product=line.product, location=instance.destination_location, rack=instance.destination_rack
                    )
                    dest_stock.quantity += line.quantity
                    dest_stock.save()