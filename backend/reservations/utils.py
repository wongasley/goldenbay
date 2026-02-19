import requests
import os

def send_sms(to_number, body):
    api_key = os.getenv('SEMAPHORE_API_KEY')
    if not api_key:
        print(f"⚠️ SMS LOG (No API Key): To {to_number} - {body}")
        return
        
    # Clean the phone number (remove spaces, dashes, etc.)
    clean_number = ''.join(filter(str.isdigit, str(to_number)))
    
    # Semaphore prefers 0917 format over 63917 for local sending
    if clean_number.startswith('63') and len(clean_number) == 12:
        clean_number = '0' + clean_number[2:]

    url = "https://api.semaphore.co/api/v4/messages"
    
    data = {
        'apikey': api_key,
        'number': clean_number,
        'message': body,
        # 'sendername': 'GOLDENBAY'  # Default is fine unless you register a custom one
    }
    
    try:
        response = requests.post(url, data=data, timeout=10)
        result = response.json()
        print(f"📲 SMS Sent to {clean_number}: {result}")
        return result
    except Exception as e:
        print(f"❌ SMS Network Error: {e}")