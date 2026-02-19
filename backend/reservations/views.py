import threading
import requests
import os
from django.db import transaction
from rest_framework import generics, status
from datetime import date
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from .models import DiningArea, Reservation, Customer, Reservation
from .serializers import ReservationSerializer, DiningAreaSerializer, CustomerSerializer # We will create these next
from django.core.mail import send_mail
from django.conf import settings
from .utils import send_sms
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class AvailableRoomsView(APIView):
    def get(self, request):
        date = request.query_params.get('date')
        session = request.query_params.get('session')

        if not date or not session:
            return Response({"error": "Date and Session required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get all active areas
        all_areas = DiningArea.objects.filter(is_active=True)
        
        # 2. Get bookings for this session/date
        bookings = Reservation.objects.filter(
            date=date, 
            session=session
        ).exclude(status='CANCELLED')

        # 3. Calculate Availability per Room
        results = []
        for area in all_areas:
            is_available = True
            current_pax = 0

            if area.area_type == 'VIP':
                # VIP Logic: If ANY booking exists, it's taken
                if bookings.filter(dining_area=area).exists():
                    is_available = False
            
            elif area.area_type == 'HALL':
                # Hall Logic: Check total capacity
                total_pax = bookings.filter(dining_area=area).aggregate(Sum('pax'))['pax__sum'] or 0
                current_pax = total_pax
                
                # If hall is full (e.g. 100 capacity, 98 booked), mark unavailable
                if total_pax >= area.capacity:
                    is_available = False
            
            data = DiningAreaSerializer(area).data
            data['is_available'] = is_available
            data['remaining_capacity'] = area.capacity - current_pax if area.area_type == 'HALL' else 0
            results.append(data)

        return Response(results)

def send_notifications_task(reservation_id):
    """ Fired when a NEW booking is created """
    try:
        reservation = Reservation.objects.select_related('dining_area').get(id=reservation_id)
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        # ==========================================
        # 1. NOTIFY THE RESTAURANT ADMINS
        # ==========================================
        
        # A. Email Admin
        admin_context = {
            'name': reservation.customer_name,
            'contact': reservation.customer_contact,
            'date': reservation.date.strftime('%B %d, %Y'),
            'time': reservation.time.strftime('%I:%M %p'),
            'pax': reservation.pax,
            'area': area_name,
            'notes': reservation.special_request or 'None',
            'id': reservation.id
        }
        admin_html = render_to_string('emails/admin_notification.html', admin_context)
        admin_plain = strip_tags(admin_html)
        
        send_mail(
            subject=f'New Booking Request: {reservation.customer_name}',
            message=admin_plain,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=['marketing@goldenbay.com.ph'], 
            html_message=admin_html,
            fail_silently=False,
        )

        # B. SMS Admin(s)
        admin_numbers_str = os.getenv('ADMIN_PHONE_NUMBERS', '')
        if admin_numbers_str:
            # Split the string by commas to get a list of numbers
            admin_numbers = [num.strip() for num in admin_numbers_str.split(',') if num.strip()]
            
            admin_sms_body = f"Golden Bay Alert: New booking request from {reservation.customer_name} for {reservation.pax} pax on {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')}. Please check dashboard."
            
            # Send to each admin number
            for number in admin_numbers:
                send_sms(number, admin_sms_body)


        # ==========================================
        # 2. NOTIFY THE CUSTOMER
        # ==========================================
        
        # A. Email Customer (Only if they provided an email address)
        if reservation.customer_email and '@' in reservation.customer_email:
            customer_context = {
                'name': reservation.customer_name,
                'status': 'PENDING',
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id
            }
            customer_html = render_to_string('emails/confirmation.html', customer_context)
            customer_plain = strip_tags(customer_html)
            
            send_mail(
                subject='Reservation Request Received - Golden Bay',
                message=customer_plain,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                html_message=customer_html,
                fail_silently=False,
            )
            
        # B. SMS Customer (Only if they provided a phone number)
        # We check if the contact field contains digits. If they entered "Viber: John123", we skip SMS.
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        
        if len(contact_digits) >= 10: # Ensure it looks like a valid phone number length
            sms_body = f"Golden Bay: Hi {reservation.customer_name}, we received your request for {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')}. Our team is reviewing it and will confirm shortly."
            send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Error in Notification Thread: {e}")

class ReservationCreateView(generics.CreateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny] 

    def perform_create(self, serializer):
        # 1. Save data to DB first
        reservation = serializer.save()

        # 2. Use a lambda inside on_commit to ensure the thread starts 
        # ONLY after the database has finished writing the record.
        transaction.on_commit(lambda: threading.Thread(
            target=send_notifications_task, 
            args=(reservation.id,)
        ).start())

class DashboardStatsView(APIView):
    def get(self, request):
        today = date.today()
        # Calculate Expected Revenue (Assuming avg 1500 PHP per person)
        pax_today = Reservation.objects.filter(date=today, status='CONFIRMED').aggregate(Sum('pax'))['pax__sum'] or 0
        expected_revenue = pax_today * 1500 

        return Response({
            "stats": {
                "today_count": Reservation.objects.filter(date=today).count(),
                "pending_count": Reservation.objects.filter(status='PENDING').count(),
                "vip_pax": Reservation.objects.filter(date=today, dining_area__area_type='VIP').aggregate(total=Sum('pax'))['total'] or 0,
                "revenue": f"₱{expected_revenue:,}" # Formatted revenue
            },
            "recent_bookings": ReservationSerializer(Reservation.objects.all().order_by('-created_at')[:5], many=True).data
        })
    
class AdminReservationListView(generics.ListCreateAPIView):
    # Lists all bookings (newest first) OR creates a manual one
    queryset = Reservation.objects.all().order_by('-created_at')
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated] # Enable this later when we add login

def send_admin_update_notifications(reservation_id, new_status):
    """ Fired when an ADMIN confirms or cancels a booking """
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        # 1. SEND HTML EMAIL (If email exists)
        if reservation.customer_email and '@' in reservation.customer_email and new_status in ['CONFIRMED', 'CANCELLED']:
            context = {
                'name': reservation.customer_name,
                'status': new_status,
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id
            }
            html_message = render_to_string('emails/confirmation.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject=f'Reservation {new_status.capitalize()} - Golden Bay',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                fail_silently=False,
                html_message=html_message
            )

        # 2. SEND SMS NOTIFICATION (If phone number exists)
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        
        if len(contact_digits) >= 10 and new_status in ['CONFIRMED', 'CANCELLED']:
            if new_status == 'CONFIRMED':
                sms_body = f"Golden Bay: Great news {reservation.customer_name}! Your table is CONFIRMED for {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')}. We look forward to serving you."
            else:
                sms_body = f"Golden Bay: Hi {reservation.customer_name}, your reservation for {reservation.date.strftime('%b %d')} has been cancelled. Please contact us at (02) 8804-0332 to reschedule."
            
            send_sms(reservation.customer_contact, sms_body)
            
    except Exception as e:
        print(f"⚠️ Notification Error for ID {reservation_id}: {e}")

class AdminReservationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated] 

    def update(self, request, *args, **kwargs):
        # 1. Perform the Database Update first
        response = super().update(request, *args, **kwargs)

        # 2. If DB update succeeded, trigger notifications in background
        if response.status_code == 200:
            reservation = self.get_object()
            new_status = request.data.get('status')
            
            # Fire and forget thread
            thread = threading.Thread(
                target=send_admin_update_notifications, 
                args=(reservation.id, new_status)
            )
            thread.start()

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

class VIPRoomListView(generics.ListAPIView):
    serializer_class = DiningAreaSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Show all rooms on one page

    def get_queryset(self):
        # Filter only VIP rooms and sort them by name
        return DiningArea.objects.filter(area_type='VIP', is_active=True).order_by('name')