import requests
import os
from django.db import transaction
from rest_framework import generics, status
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

class AvailableRoomsView(APIView):
    def get(self, request):
        date = request.query_params.get('date')
        session = request.query_params.get('session')

        if not date or not session:
            return Response({"error": "Date and Session required"}, status=status.HTTP_400_BAD_REQUEST)

        all_areas = DiningArea.objects.filter(is_active=True)
        bookings = Reservation.objects.filter(date=date, session=session).exclude(status='CANCELLED')

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

def send_notifications_task(reservation):
    """ SYNCHRONOUS: Fired when a NEW booking is created """
    try:
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        # 1. NOTIFY THE RESTAURANT ADMINS
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
            recipient_list=['goldenbay.marketing@gmail.com'],  # <--- UPDATED HERE
            html_message=admin_html,
            fail_silently=False,
        )

        admin_numbers_env = os.getenv('ADMIN_PHONE_NUMBERS')
        if admin_numbers_env:
            admin_numbers = [num.strip() for num in admin_numbers_env.split(',') if num.strip()]
            admin_sms_body = f"New Booking: {reservation.customer_name} ({reservation.pax} pax) for {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')}. Area: {area_name}. Check Dashboard."
            
            for num in admin_numbers:
                # We send them individually to ensure Semaphore handles each correctly
                send_sms(num, admin_sms_body)

        # 2. NOTIFY THE CUSTOMER
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

        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10:
             sms_body = f"Hi {reservation.customer_name}, we received your booking request for {reservation.pax} pax on {reservation.date.strftime('%b %d')}. Our team is reviewing availability and will confirm shortly. - GOLDENBAY"
             send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        # If email fails, print to server logs but don't break the customer's screen
        print(f"SMTP Email Error: {e}")

class ReservationCreateView(generics.CreateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny] 

    def perform_create(self, serializer):
        # 1. Save data to DB first
        reservation = serializer.save()
        # 2. Fire notifications directly (no thread)
        send_notifications_task(reservation)

class DashboardStatsView(APIView):
    def get(self, request):
        today = date.today()
        pax_today = Reservation.objects.filter(date=today, status='CONFIRMED').aggregate(Sum('pax'))['pax__sum'] or 0
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

def send_admin_update_notifications(reservation, new_status):
    """ SYNCHRONOUS: Fired when an ADMIN confirms or cancels a booking """
    try:
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
            
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10:
             if new_status == 'CONFIRMED':
                 sms_body = f"Great news, {reservation.customer_name}! Your table for {reservation.pax} on {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')} is CONFIRMED. See you soon! - GOLDENBAY"
                 send_sms(reservation.customer_contact, sms_body)
             elif new_status == 'CANCELLED':
                 sms_body = f"Hi {reservation.customer_name}, your reservation request has been cancelled. Please call (02) 8804-0332 to reschedule. - GOLDENBAY"
                 send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"⚠️ Notification Error for ID {reservation.id}: {e}")

class AdminReservationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated] 

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            reservation = self.get_object()
            new_status = request.data.get('status')
            # Trigger synchronously
            send_admin_update_notifications(reservation, new_status)
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
    pagination_class = None

    def get_queryset(self):
        return DiningArea.objects.filter(area_type='VIP', is_active=True).order_by('name')