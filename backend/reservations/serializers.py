from rest_framework import serializers
from django.db.models import Sum
from .models import DiningArea, Reservation, Customer
from django.db import transaction

        
class DiningAreaSerializer(serializers.ModelSerializer):

    class Meta:
        model = DiningArea
        fields = [
            'id', 'name', 'area_type', 'capacity', 'description', 'image',
            'has_ktv', 'has_restroom', 'has_tv', 'has_couch',
        ]

class ReservationSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='dining_area.name', read_only=True)
    class Meta:
        model = Reservation
        fields = '__all__'
    
    def validate(self, data):
        # 1. Setup variables: Use incoming data, otherwise fall back to existing DB instance
        instance = self.instance # This exists if we are Updating (PATCH/PUT)

        # Helper to get field from data OR instance
        def get_field(name):
            return data.get(name, getattr(instance, name, None))

        dining_area = get_field('dining_area')
        date_val = get_field('date')
        session_val = get_field('session')
        pax_val = get_field('pax')

        # If we are just updating status (and somehow missing core data), skip complex checks
        if not (dining_area and date_val and session_val and pax_val):
            return data

        # ATOMIC TRANSACTION: Locks the room until validation is finished
        with transaction.atomic():
            # We must fetch the area object to check type
            # Note: dining_area is already a model object due to DRF internal handling
            area = DiningArea.objects.select_for_update().get(id=dining_area.id)

            if area.area_type == 'VIP':
                exists = Reservation.objects.filter(
                    dining_area=area, 
                    date=date_val, 
                    session=session_val
                ).exclude(status__in=['CANCELLED', 'NO_SHOW'])
                
                # If updating, exclude self from the collision check
                if instance:
                    exists = exists.exclude(id=instance.id)

                if exists.exists():
                    raise serializers.ValidationError(f"{area.name} is already booked for this session.")

            elif area.area_type == 'HALL':
                # Sum all existing bookings
                total_pax_query = Reservation.objects.filter(
                    dining_area=area, 
                    date=date_val, 
                    session=session_val
                ).exclude(status__in=['CANCELLED', 'NO_SHOW'])

                # If updating, exclude self from the total calculation before adding new pax
                if instance:
                    total_pax_query = total_pax_query.exclude(id=instance.id)

                total_pax = total_pax_query.aggregate(Sum('pax'))['pax__sum'] or 0
                
                if (total_pax + pax_val) > area.capacity:
                    raise serializers.ValidationError(f"Only {area.capacity - total_pax} seats left in the Hall.")

        return data
    
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'