from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from rest_framework.exceptions import ValidationError

class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_storage = models.BooleanField(default=True, help_text="Can hold inventory (e.g., 4th Floor Stock Room, 1st Floor Freezer)")
    is_department = models.BooleanField(default=False, help_text="Consumes inventory (e.g., Kitchen, Dining, Dimsum)")

    def __str__(self):
        return self.name

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
    quantity = models.IntegerField(default=0, help_text="Tracked in base units")

    class Meta:
        unique_together = ('product', 'location')
        
    def __str__(self):
        return f"{self.product.name} @ {self.location.name}: {self.quantity}"

class InventoryDocument(models.Model):
    DOC_TYPES = [
        ('DELIVERY', 'Delivery (Inbound)'),
        ('REQUISITION', 'Requisition (Outbound to Dept)'),
        ('TRANSFER', 'Transfer (Storage to Storage)'),
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
    destination_location = models.ForeignKey(Location, related_name='incoming_docs', on_delete=models.SET_NULL, null=True, blank=True)
    
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

# --- CORE LOGIC: Automated Stock Movement ---
@receiver(post_save, sender=InventoryDocument)
def process_inventory_movement(sender, instance, **kwargs):
    """ Executes stock movement ONLY when a manager marks the document as APPROVED """
    if instance.status == 'APPROVED':
        with transaction.atomic():
            for line in instance.items.all():
                # 1. Deduct from Source (For Requisitions & Transfers)
                if instance.source_location:
                    source_stock, _ = StockLevel.objects.get_or_create(
                        product=line.product, location=instance.source_location
                    )
                    if source_stock.quantity < line.quantity:
                        raise ValidationError(f"Insufficient stock for {line.product.name} in {instance.source_location.name}")
                    
                    source_stock.quantity -= line.quantity
                    source_stock.save()

                # 2. Add to Destination (For Deliveries & Transfers. Requisitions are 'consumed' so they don't add to a storage location)
                if instance.destination_location and instance.destination_location.is_storage:
                    dest_stock, _ = StockLevel.objects.get_or_create(
                        product=line.product, location=instance.destination_location
                    )
                    dest_stock.quantity += line.quantity
                    dest_stock.save()