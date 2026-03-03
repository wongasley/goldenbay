from django.db import models
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords
from django.db import transaction

class DiningArea(models.Model):
    TYPE_CHOICES = [
        ('VIP', 'VIP Room'),
        ('HALL', 'Main Dining Hall (Ala Carte)'),
    ]
    name = models.CharField(max_length=100, help_text="e.g., VIP Room 1, Main Hall")
    area_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    capacity = models.IntegerField(help_text="Max pax for this room/area")
    min_pax = models.IntegerField(default=1, help_text="Minimum pax required to book")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Consumable price in PHP")
    description = models.TextField(blank=True, help_text="e.g., 'Ocean View'")
    
    # Primary Cover Image (Thumbnail)
    image = models.ImageField(upload_to='dining_areas/', blank=True, null=True)
    
    # Amenities Flags
    has_ktv = models.BooleanField(default=False, verbose_name="KTV")
    has_restroom = models.BooleanField(default=False, verbose_name="Private Restroom")
    has_tv = models.BooleanField(default=False, verbose_name="TV")
    has_couch = models.BooleanField(default=False, verbose_name="Lounge Area / Couch")

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_area_type_display()})"
    

class Reservation(models.Model):
    SESSION_CHOICES = [
        ('LUNCH', 'Lunch (11:00 AM - 2:30 PM)'),
        ('DINNER', 'Dinner (5:00 PM - 10:00 PM)'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending Confirmation'),
        ('CONFIRMED', 'Confirmed'),
        ('SEATED', 'Seated (Arrived)'),
        ('COMPLETED', 'Completed'),
        ('NO_SHOW', 'No-Show'),
        ('CANCELLED', 'Cancelled'),
    ]

    SOURCE_CHOICES = [
        ('WEB', 'Website'),
        ('WALK_IN', 'Walk-in'),
        ('PHONE', 'Phone Call'),
        ('SOCIAL', 'Social Media'),
    ]

    # Customer Info
    customer_name = models.CharField(max_length=100)
    customer_contact = models.CharField(max_length=50, help_text="Phone or Viber")
    customer_email = models.EmailField(blank=True, null=True)
    
    # Booking Details
    dining_area = models.ForeignKey(DiningArea, on_delete=models.CASCADE, related_name='reservations')
    date = models.DateField()
    session = models.CharField(max_length=10, choices=SESSION_CHOICES)
    time = models.TimeField(help_text="Specific arrival time")
    pax = models.IntegerField()
    special_request = models.TextField(blank=True, null=True)
        
    # ADD THIS LINE RIGHT HERE:
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='WEB')
    # System Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    reminder_sent = models.BooleanField(default=False, help_text="Has the 4-hour reminder been sent?")

    encoded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='encoded_reservations')
    last_modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='modified_reservations')
    
    history = HistoricalRecords() # <--- ADD THIS
    
    final_bill_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Total bill paid (for point calculation)")
    points_earned = models.IntegerField(default=0, help_text="Points awarded for this specific visit")

    class Meta:
        ordering = ['-date', '-time']

    def clean(self):
        if self.dining_area.area_type == 'VIP' and self.status != 'CANCELLED':
            clashing = Reservation.objects.filter(
                dining_area=self.dining_area,
                date=self.date,
                session=self.session
            ).exclude(pk=self.pk).exclude(status='CANCELLED')
            
            if clashing.exists():
                raise ValidationError(f"{self.dining_area.name} is already booked for this session.")

        if self.pax > self.dining_area.capacity:
            raise ValidationError(f"Guests exceed capacity ({self.dining_area.capacity}) for this room.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_name} - {self.date} ({self.session})"
    
class Customer(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, unique=True) # Phone is the unique key
    email = models.EmailField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True, help_text="Used for automated birthday promos")
    last_birthday_promo_year = models.IntegerField(blank=True, null=True, help_text="Prevents sending multiple times a year")
    # Socials
    wechat = models.CharField(max_length=100, blank=True, null=True)
    viber = models.CharField(max_length=100, blank=True, null=True)
    whatsapp = models.CharField(max_length=100, blank=True, null=True)
    telegram = models.CharField(max_length=100, blank=True, null=True)
    
    visit_count = models.IntegerField(default=0, help_text="Total completed visits")
    is_vip = models.BooleanField(default=False, help_text="Auto-tagged after 3 visits")
    
    no_show_count = models.IntegerField(default=0, help_text="Automatically calculated no-shows")
    notes = models.TextField(blank=True, null=True, help_text="VVIP status, allergies, preferences")
    created_at = models.DateTimeField(auto_now_add=True)
    last_visit = models.DateField(auto_now=True)
    last_retention_sent = models.DateField(null=True, blank=True, help_text="When the last 'We Miss You' message was sent")
    has_claimed_vip_perk = models.BooleanField(default=False, help_text="Has received the website welcome perk")

    points_balance = models.IntegerField(default=0, help_text="Current available points")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.phone})"
    
class RewardItem(models.Model):
    """ Food items that customers can redeem using their points """
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    points_required = models.IntegerField(help_text="How many points this costs")
    image = models.ImageField(upload_to='rewards/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['points_required']

    def __str__(self):
        return f"{self.name} ({self.points_required} pts)"

class PointTransaction(models.Model):
    """ The ledger that tracks every point earned or spent """
    TYPE_CHOICES = [
        ('EARNED', 'Earned'),
        ('REDEEMED', 'Redeemed'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='point_transactions')
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    points = models.IntegerField(help_text="Amount of points (e.g., 150)")
    
    # Optional context fields
    amount_spent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="If EARNED, the bill amount")
    reservation = models.ForeignKey(Reservation, on_delete=models.SET_NULL, null=True, blank=True, related_name='point_transactions', help_text="Null if walk-in")
    reward_item = models.ForeignKey(RewardItem, on_delete=models.SET_NULL, null=True, blank=True, help_text="Filled if REDEEMED")
    
    # Meta tracking
    created_at = models.DateTimeField(auto_now_add=True)
    encoded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        sign = "+" if self.transaction_type == 'EARNED' else "-"
        return f"{self.customer.name} | {sign}{self.points} pts"
        
    def save(self, *args, **kwargs):
        """ 
        Automatically update the Customer's total points balance 
        whenever a new transaction is saved!
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Lock the customer row temporarily to prevent race conditions if multiple cashiers add points at the exact same second
            with transaction.atomic():
                cust = Customer.objects.select_for_update().get(pk=self.customer.pk)
                if self.transaction_type == 'EARNED':
                    cust.points_balance += self.points
                elif self.transaction_type == 'REDEEMED':
                    cust.points_balance -= self.points
                cust.save(update_fields=['points_balance'])

# --- ADD THIS SIGNAL TO AUTO-SAVE CUSTOMERS ---
@receiver(post_save, sender=Reservation)
def save_customer_from_reservation(sender, instance, created, **kwargs):
    """
    When a Reservation is saved, automatically create or update the Customer 
    in the Phone Book based on the phone number.
    """
    if instance.customer_contact:
        try:
            # Try to find customer by phone number
            customer, created = Customer.objects.get_or_create(
                phone=instance.customer_contact,
                defaults={
                    'name': instance.customer_name,
                    'email': instance.customer_email
                }
            )
            
            # If customer exists, update the last visit
            if not created:
                customer.last_visit = instance.date
                if not customer.email and instance.customer_email:
                    customer.email = instance.customer_email
                customer.save()
        except Exception as e:
            # Prevents a 500 Server Error if the Phone Book has duplicate numbers or crashes
            print(f"Failed to auto-save customer to phonebook: {e}")