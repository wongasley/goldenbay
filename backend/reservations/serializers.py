from rest_framework import serializers
from django.db.models import Sum
from .models import DiningArea, PointTransaction, Reservation, Customer, RewardItem, RewardRedemption
from django.db import transaction

class DiningAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiningArea
        fields = [
            'id', 'name', 'area_type', 'capacity', 'price', 'description', 'image', # Added 'price' here
            'has_ktv', 'has_restroom', 'has_tv', 'has_couch',
        ]

class ReservationSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='dining_area.name', read_only=True)
    customer_no_show_count = serializers.SerializerMethodField()
    # FIX: Safely retrieve usernames to prevent 500 errors if user is None
    encoded_by_name = serializers.SerializerMethodField()
    last_modified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['encoded_by', 'last_modified_by', 'created_at', 'updated_at']
    
    def get_customer_no_show_count(self, obj):
        customer = Customer.objects.filter(phone=obj.customer_contact).first()
        return customer.no_show_count if customer else 0
        
    def get_encoded_by_name(self, obj):
        return obj.encoded_by.username if obj.encoded_by else None
        
    def get_last_modified_by_name(self, obj):
        return obj.last_modified_by.username if obj.last_modified_by else None

    def validate(self, data):
        instance = self.instance 

        def get_field(name):
            return data.get(name, getattr(instance, name, None))

        dining_area = get_field('dining_area')
        date_val = get_field('date')
        session_val = get_field('session')
        pax_val = get_field('pax')
        status_val = get_field('status') # Capture status to match model logic

        if not (dining_area and date_val and session_val and pax_val):
            return data

        # ATOMIC TRANSACTION: Locks the room until validation is finished
        with transaction.atomic():
            area = DiningArea.objects.select_for_update().get(id=dining_area.id)

            # FIX 1: Add a global capacity check for BOTH Hall and VIP rooms
            if pax_val > area.capacity:
                raise serializers.ValidationError({"pax": f"Guests exceed capacity ({area.capacity}) for this room."})

            if area.area_type == 'VIP':
                # FIX 2: Only exclude 'CANCELLED' to perfectly match the model's clean() method
                if status_val != 'CANCELLED':
                    exists = Reservation.objects.filter(
                        dining_area=area, 
                        date=date_val, 
                        session=session_val
                    ).exclude(status='CANCELLED')
                    
                    if instance:
                        exists = exists.exclude(id=instance.id)

                    if exists.exists():
                        raise serializers.ValidationError({"non_field_errors": f"{area.name} is already booked for this session."})

            elif area.area_type == 'HALL':
                total_pax_query = Reservation.objects.filter(
                    dining_area=area, 
                    date=date_val, 
                    session=session_val
                ).exclude(status__in=['CANCELLED', 'NO_SHOW'])

                if instance:
                    total_pax_query = total_pax_query.exclude(id=instance.id)

                total_pax = total_pax_query.aggregate(Sum('pax'))['pax__sum'] or 0
                
                if (total_pax + pax_val) > area.capacity:
                    raise serializers.ValidationError({"pax": f"Only {area.capacity - total_pax} seats left in the Hall."})

        return data

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class RewardItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardItem
        fields = '__all__'

class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = '__all__'

class AwardPointsSerializer(serializers.Serializer):
    """ Custom serializer for the Cashier 'Quick Add' pop-up """
    phone = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    amount_spent = serializers.DecimalField(max_digits=10, decimal_places=2)

class RewardRedemptionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    reward_name = serializers.CharField(source='reward_item.name', read_only=True)
    fulfilled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RewardRedemption
        fields = '__all__'
        read_only_fields = ['customer', 'reward_item', 'created_at', 'fulfilled_by']

    def get_fulfilled_by_name(self, obj):
        return obj.fulfilled_by.username if obj.fulfilled_by else None