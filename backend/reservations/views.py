import requests
import os
from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from datetime import date, timedelta
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
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
        # FIX: Removed `_history_user=user`. The middleware handles history tracking automatically.
        reservation = serializer.save(encoded_by=user)
        send_sms_flag = str(self.request.data.get('send_sms', 'true')).lower() == 'true'
        # 2. Fire notifications ASYNCHRONOUSLY
        try:
            # 2. Pass flag to celery
            send_new_booking_notifications.delay(reservation.id, send_sms_flag) 
        except Exception as e:
            print(f"Warning: Could not queue celery task: {e}")

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
            "chart_data": chart_data, 
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
        # FIX: Removed `_history_user=self.request.user`
        serializer.save(last_modified_by=self.request.user)

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
            
        send_sms_flag = str(request.data.get('send_sms', 'true')).lower() == 'true'    
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
                
                try:
                    # Trigger Post-Dining Feedback (Wait 7200 seconds / 2 Hours)
                    from .tasks import send_post_dining_feedback
                    send_post_dining_feedback.apply_async((reservation.id, send_sms_flag), countdown=7200)
                except Exception as e:
                    print(f"Warning: Could not queue celery task: {e}")
                
            elif status_changed and reservation.status in ['CONFIRMED', 'CANCELLED']:
                try:
                    send_status_update_notifications.delay(reservation.id, reservation.status, send_sms_flag)
                except Exception as e:
                    print(f"Warning: Could not queue celery task: {e}")
            
            elif details_changed and reservation.status != 'CANCELLED':
                try:
                    from .tasks import send_booking_modification_notifications
                    send_booking_modification_notifications.delay(reservation.id, send_sms_flag)
                except Exception as e:
                    print(f"Warning: Could not queue celery task: {e}")
                
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
    

from datetime import datetime

class ChatbotBookingWebhook(APIView):
    permission_classes = [] 

    def post(self, request):
        bot_token = request.headers.get('X-Bot-Token')
        if bot_token != os.getenv('BOT_SECRET_TOKEN', 'GoldenBaySecureBot2026!'):
            return Response({"messages": [{"text": "Unauthorized"}]}, status=401)

        data = request.data
        
        try:
            name = data.get('name')
            contact = data.get('contact')
            date_str = data.get('date') 
            
            # 1. FIX: Missing data check
            if not name or not contact or not date_str:
                 return Response({"messages": [{"text": "Missing required details (Name, Contact, or Date). Please try again."}]}, status=200)

            # 2. FIX: Safe integer casting for pax
            raw_pax = data.get('pax')
            pax = int(raw_pax) if raw_pax else 2
            
            session = data.get('session', 'LUNCH')
            area_type_request = data.get('area_type', 'HALL')
            
            # Smart Time Assignment
            time_str = data.get('time')
            if not time_str:
                time_str = "11:00:00" if session == 'LUNCH' else "17:30:00"

            assigned_area = None
            transfer_notice = ""

            # --- 1. VIP ROOM LOGIC WITH STRICT PAX BRACKETS ---
            if area_type_request == 'VIP':
                suitable_rooms_query = DiningArea.objects.filter(area_type='VIP', is_active=True)

                if pax <= 8:
                    suitable_rooms_query = suitable_rooms_query.filter(name__in=['VIP Room 2', 'VIP Room 3', 'VIP Room 5', 'VIP Room 7', 'VIP Room 8'])
                elif 8 < pax <= 12:
                    suitable_rooms_query = suitable_rooms_query.filter(name__in=['VIP Room 11', 'VIP Room 12', 'VIP Room 15'])
                elif 12 < pax <= 18:
                    suitable_rooms_query = suitable_rooms_query.filter(name='VIP Room 10')
                elif 18 < pax <= 20:
                    suitable_rooms_query = suitable_rooms_query.filter(name__in=['VIP Room 1', 'VIP Room 9'])
                elif 20 < pax <= 24:
                    suitable_rooms_query = suitable_rooms_query.filter(name='VIP Room 6')
                elif 24 < pax <= 60:
                    suitable_rooms_query = suitable_rooms_query.filter(name='MANILA VIP Room')
                else:
                    return Response({"messages": [{"text": f"Sorry! We don't have a single VIP room large enough for {pax} guests. Please call us at (02) 8804-0332 for banquet options."}]}, status=200)

                # Check which of these specific rooms are free
                for room in suitable_rooms_query.order_by('capacity'):
                    is_booked = Reservation.objects.filter(
                        dining_area=room, date=date_str, session=session
                    ).exclude(status__in=['CANCELLED', 'NO_SHOW']).exists()
                    
                    if not is_booked:
                        assigned_area = room
                        break

                # FALLBACK: If VIP tier is full, try the Main Hall
                if not assigned_area:
                    main_hall = DiningArea.objects.filter(area_type='HALL', is_active=True).first()
                    if main_hall:
                        total_pax = Reservation.objects.filter(
                            dining_area=main_hall, date=date_str, session=session
                        ).exclude(status__in=['CANCELLED', 'NO_SHOW']).aggregate(Sum('pax'))['pax__sum'] or 0
                        
                        if (total_pax + pax) <= main_hall.capacity:
                            assigned_area = main_hall
                            transfer_notice = "Note: Our VIP rooms for your guest count are fully booked, so we have secured a table for you in our Main Dining Hall instead. ✨\n\n"

            # --- 2. MAIN HALL LOGIC (Direct request or fallback) ---
            else:
                assigned_area = DiningArea.objects.filter(area_type='HALL', is_active=True).first()
                if assigned_area:
                    total_pax = Reservation.objects.filter(
                        dining_area=assigned_area, date=date_str, session=session
                    ).exclude(status__in=['CANCELLED', 'NO_SHOW']).aggregate(Sum('pax'))['pax__sum'] or 0
                    
                    if (total_pax + pax) > assigned_area.capacity:
                        assigned_area = None # Mark as full

            # --- 3. FULLY BOOKED RESPONSE ---
            if not assigned_area:
                return Response({
                    "messages": [
                        {
                            "text": f"We are sorry! We are fully booked for {session} on {date_str}. Would you like to check another date?",
                            "quick_replies": [
                                {"content_type": "text", "title": "Check Another Date", "payload": "RESTART"},
                                {"content_type": "text", "title": "View Menu", "payload": "MENU"}
                            ]
                        }
                    ]
                }, status=200)

            # --- 4. CREATE RESERVATION ---
            reservation = Reservation.objects.create(
                customer_name=name, customer_contact=contact, date=date_str,
                session=session, time=time_str, pax=pax, dining_area=assigned_area,
                source='SOCIAL', status='PENDING' 
            )

            from .tasks import send_new_booking_notifications
            send_new_booking_notifications.delay(reservation.id)

            # 3. FIX: Display the actual parsed time elegantly
            time_obj = datetime.strptime(time_str, "%H:%M:%S")
            display_time = time_obj.strftime("%I:%M %p")
            
            success_msg = f"{transfer_notice}Success! 🎉 Your table for {pax} on {date_str} at {display_time} in {assigned_area.name} is reserved. Ref: #{reservation.id}"
            
            return Response({"messages": [{"text": success_msg}]}, status=200)

        except Exception as e:
            # We print the error to your server logs so you can debug if it fails
            print(f"Chatbot Webhook Error: {e}") 
            return Response({"messages": [{"text": "Something went wrong. Please try again or call us at (02) 8804-0332."}]}, status=200)