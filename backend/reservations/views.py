import threading
import requests
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
    """
    Refined background task with better logging.
    """
    try:
        # 1. Fetch fresh data. Using .select_related handles the dining_area join
        reservation = Reservation.objects.select_related('dining_area').get(id=reservation_id)
        
        print(f"DEBUG: Processing notifications for Reservation #{reservation.id}")

        # 2. Email Admin
        admin_subject = f'New Booking Request: {reservation.customer_name} ({reservation.date})'
        admin_message = f"""
        New Reservation Request:
        ------------------------
        Name: {reservation.customer_name}
        Date: {reservation.date}
        Time: {reservation.time}
        Guests: {reservation.pax}
        Contact: {reservation.customer_contact}
        Room: {reservation.dining_area.name if reservation.dining_area else 'Main Hall'}
        Notes: {reservation.special_request or 'None'}

        Please log in to the dashboard to Confirm or Cancel.
        """
        
        send_mail(
            subject=admin_subject,
            message=admin_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=['marketing@goldenbay.com.ph'], 
            fail_silently=False, # CHANGED to False so we see errors in terminal
        )

        # 3. Email Customer (Only if they provided an email)
        if reservation.customer_email:
            print(f"DEBUG: Sending confirmation to {reservation.customer_email}")
            send_mail(
                subject='Reservation Received - Golden Bay',
                message=f'Dear {reservation.customer_name},\n\nWe received your request for {reservation.date} at {reservation.time}. Our staff will review and contact you shortly to confirm.',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                fail_silently=False, # CHANGED to False
            )
            
    except Reservation.DoesNotExist:
        print(f"ERROR: Notification thread could not find Reservation ID {reservation_id}")
    except Exception as e:
        print(f"SMTP ERROR in Background Thread: {e}")

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
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        
        # Only send if email exists and status is relevant
        if reservation.customer_email and new_status in ['CONFIRMED', 'CANCELLED']:
            
            # 1. Prepare Data for the HTML Template
            context = {
                'name': reservation.customer_name,
                'status': new_status,
                'date': reservation.date.strftime('%B %d, %Y'), # e.g. February 14, 2026
                'time': reservation.time.strftime('%I:%M %p'),  # e.g. 07:00 PM
                'pax': reservation.pax,
                'area': reservation.dining_area.name if reservation.dining_area else "Main Dining Hall",
                'id': reservation.id
            }

            # 2. Render HTML to String
            html_message = render_to_string('emails/confirmation.html', context)
            
            # 3. Create Plain Text Version (For spam filters/old email clients)
            plain_message = strip_tags(html_message)

            # 4. Define Subject
            subject = f'Reservation {new_status.capitalize()} - Golden Bay'

            # 5. Send
            send_mail(
                subject=subject,
                message=plain_message, # Plain text fallback
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                fail_silently=False,
                html_message=html_message # <--- The Luxury HTML
            )

            print(f"DEBUG: Sent HTML email to {reservation.customer_email}")
            
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