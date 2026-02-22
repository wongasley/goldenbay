# backend/reservations/views.py

import requests
import os
from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from datetime import date, timedelta
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db.models import Sum
from .models import DiningArea, Reservation, Customer
from .serializers import ReservationSerializer, DiningAreaSerializer, CustomerSerializer
from django.core.mail import send_mail
from django.conf import settings
from .utils import send_sms
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .tasks import send_new_booking_notifications, send_status_update_notifications

class AvailableRoomsView(APIView):
    def get(self, request):
        date = request.query_params.get('date')
        session = request.query_params.get('session')

        if not date or not session:
            return Response({"error": "Date and Session required"}, status=status.HTTP_400_BAD_REQUEST)

        all_areas = DiningArea.objects.filter(is_active=True)
        bookings = Reservation.objects.filter(date=date, session=session).exclude(status__in=['CANCELLED', 'NO_SHOW'])

        results = []
        for area in all_areas:
            is_available = True
            current_pax = 0

            if area.area_type == 'VIP':
                if bookings.filter(dining_area=area).exists():
                    is_available = False
            elif area.area_type == 'HALL':
                total_pax = bookings.filter(dining_area=area).aggregate(Sum('pax'))['pax__sum'] or 0
                current_pax = total_pax
                if total_pax >= area.capacity:
                    is_available = False
            
            data = DiningAreaSerializer(area).data
            data['is_available'] = is_available
            data['remaining_capacity'] = area.capacity - current_pax if area.area_type == 'HALL' else 0
            results.append(data)

        return Response(results)

class ReservationCreateView(generics.CreateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny] 

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        # 1. Save data to DB first
        reservation = serializer.save(encoded_by=user, _history_user=user)
        # 2. Fire notifications ASYNCHRONOUSLY using Celery (.delay)
        send_new_booking_notifications.delay(reservation.id)

class DashboardStatsView(APIView):
    def get(self, request):
        today = date.today()
        pax_today = Reservation.objects.filter(
            date=today, 
            status__in=['CONFIRMED', 'SEATED', 'COMPLETED']
        ).aggregate(Sum('pax'))['pax__sum'] or 0
        expected_revenue = pax_today * 1500 

        # Generate last 7 days chart data
        chart_data = []
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            count = Reservation.objects.filter(date=target_date).count()
            chart_data.append({
                "date": target_date.strftime("%b %d"),
                "bookings": count
            })

        return Response({
            "stats": {
                "today_count": Reservation.objects.filter(date=today).count(),
                "pending_count": Reservation.objects.filter(status='PENDING').count(),
                "vip_pax": Reservation.objects.filter(date=today, dining_area__area_type='VIP').aggregate(total=Sum('pax'))['total'] or 0,
                "revenue": f"₱{expected_revenue:,}"
            },
            "chart_data": chart_data,  # <--- New Chart Data
            "recent_bookings": ReservationSerializer(Reservation.objects.all().order_by('-created_at')[:5], many=True).data
        })
    
class AdminReservationListView(generics.ListCreateAPIView):
    queryset = Reservation.objects.all().order_by('-created_at')
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated] 

class AdminReservationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        # Inject the staff member modifying the record
        serializer.save(last_modified_by=self.request.user, _history_user=self.request.user)

    def update(self, request, *args, **kwargs):
        # 1. Capture the old data BEFORE saving
        old_instance = self.get_object()
        old_status = old_instance.status
        old_room_id = old_instance.dining_area_id
        old_date = old_instance.date
        old_time = old_instance.time

        new_status = request.data.get('status', old_status)
        
        # Prevent Receptionists from Cancelling
        if new_status == 'CANCELLED' and old_status != 'CANCELLED':
            if not (request.user.is_superuser or request.user.groups.filter(name__in=['Supervisor', 'Admin']).exists()):
                raise PermissionDenied("Only Supervisors and Admins can cancel bookings.")
        
        # Prevent Receptionists from changing a Completed or Cancelled booking back to active
        if old_status in ['COMPLETED', 'CANCELLED'] and new_status not in ['COMPLETED', 'CANCELLED']:
            if not (request.user.is_superuser or request.user.groups.filter(name__in=['Supervisor', 'Admin']).exists()):
                 raise PermissionDenied("Only Supervisors and Admins can reopen finalized bookings.")
            
        # 2. Perform the save (this automatically runs your collision validations)
        response = super().update(request, *args, **kwargs)

        if response.status_code == 200:
            reservation = self.get_object()
            
            status_changed = old_status != reservation.status
            details_changed = (old_room_id != reservation.dining_area_id) or \
                              (old_date != reservation.date) or \
                              (old_time != reservation.time)

            # 3. Fire appropriate notification & Logic
            if status_changed and reservation.status == 'COMPLETED':
                # Track Visit & VIP Status
                customer = Customer.objects.filter(phone=reservation.customer_contact).first()
                if customer:
                    customer.visit_count += 1
                    if customer.visit_count >= 3: # Tag as VIP after 3 visits
                        customer.is_vip = True
                    customer.save()
                
                # Trigger Post-Dining Feedback (Wait 7200 seconds / 2 Hours)
                from .tasks import send_post_dining_feedback
                send_post_dining_feedback.apply_async((reservation.id,), countdown=7200)
                
            elif status_changed and reservation.status in ['CONFIRMED', 'CANCELLED']:
                send_status_update_notifications.delay(reservation.id, reservation.status)
            elif details_changed and reservation.status != 'CANCELLED':
                from .tasks import send_booking_modification_notifications
                send_booking_modification_notifications.delay(reservation.id)
                
        return response
    
class CustomerListView(generics.ListCreateAPIView):
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
         if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
             raise PermissionDenied("Only Admins can delete customer records.")
         return super().delete(request, *args, **kwargs)

class VIPRoomListView(generics.ListAPIView):
    serializer_class = DiningAreaSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return DiningArea.objects.filter(area_type='VIP', is_active=True).order_by('name')