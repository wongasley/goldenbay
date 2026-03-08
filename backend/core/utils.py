# backend/core/utils.py
import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError
from rest_framework.throttling import SimpleRateThrottle

def verify_recaptcha(token):
    """
    Verifies the invisible reCAPTCHA v3 token with Google.
    Requires a score of 0.5 or higher to pass.
    """
    if not token:
        raise ValidationError({"error": "Security check failed. Missing CAPTCHA token."})
    
    response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': settings.RECAPTCHA_SECRET_KEY,
            'response': token
        }
    )
    result = response.json()
    
    if not result.get('success') or result.get('score', 0) < 0.5:
        raise ValidationError({"error": "Unusual activity detected. Please try again later."})

class OTPPhoneNumberThrottle(SimpleRateThrottle):
    """
    Limits requests based strictly on the phone number provided in the payload,
    preventing SMS toll fraud against a single victim.
    """
    scope = 'otp_phone'

    def get_cache_key(self, request, view):
        phone = request.data.get('phone')
        if not phone:
            return None # Fallback to standard IP throttle if no phone is present
        
        # Clean phone number to ensure consistent cache locking
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith('63') and len(clean_phone) == 12:
            clean_phone = '0' + clean_phone[2:]
            
        return self.cache_format % {
            'scope': self.scope,
            'ident': clean_phone
        }