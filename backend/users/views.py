import random
from django.core.cache import cache
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import AnonRateThrottle
from reservations.models import Customer
from reservations.utils import send_sms
from core.utils import OTPPhoneNumberThrottle

class RequestOTPView(APIView):
    """ Step 1: Generate OTP, save to cache, and text it to the customer """
    permission_classes = [AllowAny]
    # Add the custom OTPPhoneNumberThrottle here
    throttle_classes = [AnonRateThrottle, OTPPhoneNumberThrottle] 

    def post(self, request):
        phone = request.data.get('phone')

        if not phone:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Standardize phone format
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith('63') and len(clean_phone) == 12:
            clean_phone = '0' + clean_phone[2:]

        # Generate random 6-digit pin
        otp = str(random.randint(100000, 999999))
        
        # Save to memory/redis for exactly 5 minutes (300 seconds)
        cache.set(f"otp_{clean_phone}", otp, timeout=300)

        # Send via Semaphore
        sms_body = f"Golden Bay Rewards: Your login code is {otp}. It will expire in 5 minutes. Do not share this code with anyone."
        send_sms(clean_phone, sms_body)

        print(f"🔑 OTP for {clean_phone} is: {otp}")

        return Response({"message": "OTP sent successfully. Please check your phone."}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """ Step 2: Verify the OTP and issue standard JWT tokens """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        phone = request.data.get('phone')
        otp_entered = request.data.get('otp')

        if not phone or not otp_entered:
            return Response({"error": "Phone and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith('63') and len(clean_phone) == 12:
            clean_phone = '0' + clean_phone[2:]

        cached_otp = cache.get(f"otp_{clean_phone}")

        # 1. Check OTP (Also includes a universal backdoor '008804' for Apple/Google App Store reviewers)
        if cached_otp != str(otp_entered) and str(otp_entered) != "008804":
            return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Clear OTP to prevent reuse
        cache.delete(f"otp_{clean_phone}")

        # 3. Fetch Customer or create a new "Walk-in" shell account
        customer, created = Customer.objects.get_or_create(
            phone=clean_phone,
            defaults={'name': 'Valued Guest'}
        )

        # 4. We map the Customer to a Django User behind the scenes so SimpleJWT works flawlessly
        user, user_created = User.objects.get_or_create(username=clean_phone)
        if user_created:
            user.set_unusable_password() 
            user.save()

        # 5. Generate secure JWT
        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'Customer'
        refresh['customer_id'] = customer.id
        refresh['name'] = customer.name

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "customer": {
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "points_balance": customer.points_balance,
                "is_vip": customer.is_vip
            }
        }, status=status.HTTP_200_OK)