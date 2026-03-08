import os
from datetime import date, timedelta
from django.db.models import Sum
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
import math
from django.db import transaction
from decimal import Decimal

from .utils import send_sms
from .models import DiningArea, PointTransaction, Reservation, Customer, RewardItem, RewardRedemption
from .serializers import AwardPointsSerializer, ReservationSerializer, DiningAreaSerializer, CustomerSerializer, RewardItemSerializer, RewardRedemptionSerializer
from .tasks import (
    send_new_booking_notifications,
    send_points_awarded_sms, 
    send_status_update_notifications, 
    send_booking_modification_notifications, 
    send_post_dining_feedback
)
from django.shortcuts import get_object_or_404
# --- NEW: Import the CAPTCHA verifier ---
from core.utils import verify_recaptcha


class AvailableRoomsView(APIView):
    def get(self, request):
        date_param = request.query_params.get('date')
        session = request.query_params.get('session')

        if not date_param or not session:
            return Response({"error": "Date and Session required"}, status=status.HTTP_400_BAD_REQUEST)

        all_areas = DiningArea.objects.filter(is_active=True)
        bookings = Reservation.objects.filter(date=date_param, session=session).exclude(status__in=['CANCELLED', 'NO_SHOW'])

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

    # --- NEW: Intercept the request before saving to check CAPTCHA ---
    def create(self, request, *args, **kwargs):
        # We only mandate CAPTCHA for website users. Admins skip this.
        if not request.user.is_authenticated:
            captcha_token = request.data.get('captcha_token')
            verify_recaptcha(captcha_token)
            
        return super().create(request, *args, **kwargs)
    # -----------------------------------------------------------------

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        
        # 1. Save data to DB first
        reservation = serializer.save(encoded_by=user)
        send_sms_flag = str(self.request.data.get('send_sms', 'true')).lower() == 'true'
        
        # 2. Fire notifications ASYNCHRONOUSLY based on creation status
        try:
            # 🔴 UPDATED: If an Admin/Receptionist makes a manual booking (CONFIRMED)
            if reservation.status == 'CONFIRMED':
                send_status_update_notifications.delay(reservation.id, 'CONFIRMED', send_sms_flag)
                # Send the "New Booking" alert to Admins, but skip sending the "Pending" text to the customer
                send_new_booking_notifications.delay(reservation.id, send_sms_flag, notify_customer=False) 
            
            # If a customer books via the Website (PENDING)
            else:
                send_new_booking_notifications.delay(reservation.id, send_sms_flag, notify_customer=True) 
                
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
        serializer.save(last_modified_by=self.request.user)

    def update(self, request, *args, **kwargs):
        # 1. Capture the old data BEFORE saving
        old_instance = self.get_object()
        old_status = old_instance.status
        old_room_id = old_instance.dining_area_id
        old_date = old_instance.date
        old_time = old_instance.time

        new_status = request.data.get('status', old_status)
        
        # --- 🔴 PREVENT RECEPTIONISTS FROM CANCELING ---
        if new_status == 'CANCELLED' and old_status != 'CANCELLED':
            if not (request.user.is_superuser or request.user.groups.filter(name__in=['Supervisor', 'Admin']).exists()):
                raise PermissionDenied("To delete current booking, please contact Manager to help cancel")
        
        # Prevent Receptionists from changing a Completed or Cancelled booking back to active
        if old_status in ['COMPLETED', 'CANCELLED'] and new_status not in ['COMPLETED', 'CANCELLED']:
            if not (request.user.is_superuser or request.user.groups.filter(name__in=['Supervisor', 'Admin']).exists()):
                 raise PermissionDenied("Only Supervisors and Admins can reopen finalized bookings.")
            
        send_sms_flag = str(request.data.get('send_sms', 'true')).lower() == 'true'    
        
        # 2. Perform the save
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
                    if customer.visit_count >= 3: 
                        customer.is_vip = True
                    customer.save()
                
                try:
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
            
            # SAFETY CHECK 1: Missing data check
            if not name or not contact or not date_str:
                 return Response({"messages": [{"text": "Missing required details (Name, Contact, or Date). Please try again."}]}, status=200)

            # SAFETY CHECK 2: Safe integer casting for pax
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
                    return Response({"messages": [{"text": f"Sorry! We don't have a single VIP room large enough for {pax} guests. Please call us at +63 917 580 7166 for banquet options."}]}, status=200)

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
                        assigned_area = None

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

            send_new_booking_notifications.delay(reservation.id)

            display_time = "11:00 AM" if session == 'LUNCH' else "5:30 PM"
            success_msg = f"{transfer_notice}Success! 🎉 Your table for {pax} on {date_str} at {display_time} in {assigned_area.name} is reserved. Ref: #{reservation.id}"
            
            return Response({"messages": [{"text": success_msg}]}, status=200)

        except Exception as e:
            print(f"Chatbot Webhook Error: {e}") 
            return Response({"messages": [{"text": "Something went wrong. Please try again or call us at +63 917 580 7166."}]}, status=200)
        
class LeadCaptureView(APIView):
    """ Public endpoint for the frontend VIP Perk Widget """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        # --- NEW: Verify Bot Status before processing Lead ---
        captcha_token = request.data.get('captcha_token')
        verify_recaptcha(captcha_token)
        # ------------------------------------------------------

        name = request.data.get('name')
        phone = request.data.get('phone')
        email = request.data.get('email')
        dob = request.data.get('dob') 

        if not dob: dob = None
        if not name or not phone:
            return Response({"error": "Name and Phone are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Clean the phone number
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith('63') and len(clean_phone) == 12:
            clean_phone = '0' + clean_phone[2:]

        # Fetch or create the customer
        customer, created = Customer.objects.get_or_create(
            phone=clean_phone,
            defaults={'name': name, 'email': email, 'date_of_birth': dob, 'notes': 'Captured via Website VIP Widget'}
        )

        # --- NEW: Check if they already claimed it ---
        if customer.has_claimed_vip_perk:
            # Update info just in case they added a new email/birthday
            if email and not customer.email: customer.email = email
            if dob and not customer.date_of_birth: customer.date_of_birth = dob
            customer.save()
            return Response({
                "status": "already_joined", 
                "message": "You are already on our VIP list! We look forward to seeing you."
            }, status=status.HTTP_200_OK)

        # --- If they haven't claimed it yet ---
        customer.has_claimed_vip_perk = True
        if not created: # Enrich existing profile
            if email and not customer.email: customer.email = email
            if dob and not customer.date_of_birth: customer.date_of_birth = dob
            
        customer.save()

        # --- SEND THE ACTUAL SMS COUPON ---
        if len(clean_phone) >= 10:
            sms_body = (
                f"GOLDEN BAY VIP E-PASS: Welcome, {name}! Present this to our receptionist "
                f"to claim your complimentary Signature Dessert. ✨ Welcome to Golden Bay Rewards! "
                f"Earn points on every visit and receive exclusive rewards. "
                f"To log in, go to https://goldenbay.com.ph/rewards "
                f"For reservations, contact our mobile: +63 917 580 7166."
            )
            send_sms(customer.phone, sms_body)

        return Response({
            "status": "success", 
            "message": "Success! Check your SMS for your VIP perk."
        }, status=status.HTTP_200_OK)
    
class RewardItemListView(generics.ListAPIView):
    """ Public endpoint to list all available rewards """
    queryset = RewardItem.objects.filter(is_active=True).order_by('points_required')
    serializer_class = RewardItemSerializer
    permission_classes = [AllowAny]


class AwardPointsView(APIView):
    """ Endpoint for cashiers to quickly add points via phone number """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AwardPointsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        amount_spent = Decimal(str(serializer.validated_data['amount_spent']))
        name = serializer.validated_data.get('name', 'Valued Guest')

        # Clean the phone number
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith('63') and len(clean_phone) == 12:
            clean_phone = '0' + clean_phone[2:]

        # 1. Get or Create Customer
        customer, created = Customer.objects.get_or_create(
            phone=clean_phone,
            defaults={'name': name}
        )

        # Update name if it was a generic "Valued Guest" previously
        if not created and name != 'Valued Guest' and customer.name == 'Valued Guest':
            customer.name = name
            customer.save(update_fields=['name'])

        # 2. NEW LOGIC: Calculate Points with VIP Multiplier
        # Base: 100 PHP = 1 Point
        # VIP: 100 PHP = 1.5 Points
        base_rate = amount_spent / 100
        multiplier = Decimal('1.5') if customer.is_vip else Decimal('1.0')
        points_earned = math.floor(base_rate * multiplier)

        if points_earned <= 0:
            return Response({"message": "Amount too low to earn points."}, status=status.HTTP_200_OK)

        # 3. Create Transaction
        PointTransaction.objects.create(
            customer=customer,
            transaction_type='EARNED',
            points=points_earned,
            amount_spent=amount_spent,
            encoded_by=request.user
        )

        # Fetch the updated customer to get the fresh balance
        customer.refresh_from_db()

        # 4. Fire Background SMS
        send_points_awarded_sms.delay(customer.id, points_earned, customer.points_balance)

        return Response({
            "message": "Points successfully awarded!",
            "customer_name": customer.name,
            "is_vip": customer.is_vip,
            "points_earned": points_earned,
            "new_balance": customer.points_balance
        }, status=status.HTTP_200_OK)
    
class RedeemRewardView(APIView):
    """
    Atomic points deduction to prevent double-spending exploits.
    Uses database-level row locking (SELECT FOR UPDATE).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer_phone = request.user.username
        reward_id = request.data.get('reward_id')

        if not reward_id:
            return Response({"error": "Reward ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Lock the customer row immediately to prevent race conditions
                try:
                    customer = Customer.objects.select_for_update().get(phone=customer_phone)
                except Customer.DoesNotExist:
                    return Response({"error": "Customer profile not found."}, status=status.HTTP_404_NOT_FOUND)
                
                # 2. Identify the reward
                try:
                    reward = RewardItem.objects.get(id=reward_id, is_active=True)
                except RewardItem.DoesNotExist:
                    return Response({"error": "Reward is currently unavailable."}, status=status.HTTP_404_NOT_FOUND)

                # 3. Final Balance Validation (Happens while row is locked)
                if customer.points_balance < reward.points_required:
                    return Response({
                        "error": "Insufficient points balance.",
                        "current_balance": customer.points_balance,
                        "required": reward.points_required
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 4. Create the Fulfillment Ticket for staff
                RewardRedemption.objects.create(
                    customer=customer, 
                    reward_item=reward, 
                    status='PENDING'
                )

                # 5. Log the deduction (Deducts points via your models.py save logic)
                PointTransaction.objects.create(
                    customer=customer, 
                    transaction_type='REDEEMED', 
                    points=reward.points_required,
                    reward_item=reward
                )
                
                # 6. Get the fresh balance after deduction
                customer.refresh_from_db()
                
                return Response({
                    "message": f"Successfully redeemed {reward.name}! Please show this to your waiter.",
                    "new_balance": customer.points_balance
                }, status=status.HTTP_200_OK)

        except Exception as e:
            # Catching generic DB errors or connection issues
            print(f"Redemption Error: {e}")
            return Response({"error": "An internal error occurred. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class StaffRedemptionListView(generics.ListAPIView):
    """ Lists all redemptions for the staff dashboard """
    queryset = RewardRedemption.objects.all().order_by('-created_at')
    serializer_class = RewardRedemptionSerializer
    permission_classes = [IsAuthenticated]

class StaffRedemptionUpdateView(generics.UpdateAPIView):
    """ Allows staff to mark tickets as CLAIMED or CANCELLED """
    queryset = RewardRedemption.objects.all()
    serializer_class = RewardRedemptionSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != 'PENDING':
            return Response({"error": "This ticket has already been processed."}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        # Save the user who clicked the button
        instance = serializer.save(fulfilled_by=self.request.user)
        
        # If staff cancels the ticket, automatically refund the points!
        if instance.status == 'CANCELLED':
            with transaction.atomic():
                customer = Customer.objects.select_for_update().get(id=instance.customer.id)
                customer.points_balance += instance.reward_item.points_required
                customer.save(update_fields=['points_balance'])
                
                # Log the refund in the transaction ledger
                PointTransaction.objects.create(
                    customer=customer,
                    transaction_type='EARNED',
                    points=instance.reward_item.points_required,
                    reward_item=instance.reward_item,
                    encoded_by=self.request.user,
                )

class OwnerReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Owner', 'Admin']).exists()):
            raise PermissionDenied("Only Owners and Admins can view financial reports.")
        today = date.today()
        
        # 1. Today's Metrics
        today_active_res = Reservation.objects.filter(date=today).exclude(status__in=['CANCELLED', 'NO_SHOW'])
        today_bookings = today_active_res.count()
        today_pax = today_active_res.aggregate(Sum('pax'))['pax__sum'] or 0
        today_vip_rooms = today_active_res.filter(dining_area__area_type='VIP').count()
        expected_revenue = today_pax * 1500  # Estimate: 1500 PHP per head

        # 2. All-Time Metrics
        total_customers = Customer.objects.count()
        total_vip_customers = Customer.objects.filter(is_vip=True).count()
        total_bookings = Reservation.objects.exclude(status__in=['CANCELLED', 'NO_SHOW']).count()
        total_points_in_circulation = Customer.objects.aggregate(Sum('points_balance'))['points_balance__sum'] or 0

        # 3. 30-Day Trend Chart
        chart_data = []
        for i in range(29, -1, -1):
            target_date = today - timedelta(days=i)
            day_res = Reservation.objects.filter(date=target_date).exclude(status__in=['CANCELLED', 'NO_SHOW'])
            
            # Count bookings and pax for that specific day
            b_count = day_res.count()
            p_count = day_res.aggregate(Sum('pax'))['pax__sum'] or 0
            
            chart_data.append({
                "date": target_date.strftime("%b %d"),
                "bookings": b_count,
                "pax": p_count,
                "revenue": p_count * 1500
            })

        return Response({
            "today": {
                "bookings": today_bookings,
                "pax": today_pax,
                "vip_rooms_occupied": today_vip_rooms,
                "estimated_revenue": f"₱{expected_revenue:,}"
            },
            "all_time": {
                "total_customers": total_customers,
                "total_vip_customers": total_vip_customers,
                "total_bookings": total_bookings,
                "points_liability": total_points_in_circulation
            },
            "chart_data": chart_data
        })
    
class ManageBookingByTokenView(APIView):
    """ Allows guests to view and cancel their booking using their secure email link """
    permission_classes = [AllowAny]

    def get(self, request, token):
        reservation = get_object_or_404(Reservation, management_token=token)
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

    def patch(self, request, token):
        reservation = get_object_or_404(Reservation, management_token=token)
        
        if reservation.status in ['COMPLETED', 'NO_SHOW', 'CANCELLED']:
            return Response({"error": "This booking can no longer be modified."}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        if action == 'CANCEL':
            reservation.status = 'CANCELLED'
            reservation.save()
            
            # Fire email/SMS cancellation alerts
            send_status_update_notifications.delay(reservation.id, 'CANCELLED', send_sms_flag=True)
            
            return Response({"message": "Reservation successfully cancelled."}, status=status.HTTP_200_OK)
            
        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)