from rest_framework.exceptions import ValidationError
from rest_framework.throttling import SimpleRateThrottle

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