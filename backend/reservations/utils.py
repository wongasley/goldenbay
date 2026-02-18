import requests
import os

def send_sms(to_number, body):
    api_key = os.getenv('SEMAPHORE_API_KEY')
    if not api_key:
        print(f"SMS LOG (No API Key): To {to_number} - {body}")
        return
        
    url = "https://semaphore.co/api/v4/messages"
    # Ensure number starts with 09 for PH local
    data = {
        'apikey': api_key,
        'number': to_number,
        'message': body,
        'sendername': 'GOLDENBAY' # Note: Requires Semaphore approval
    }
    try:
        response = requests.post(url, data=data)
        return response.json()
    except Exception as e:
        print(f"SMS Network Error: {e}")