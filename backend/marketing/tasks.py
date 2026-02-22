# backend/marketing/tasks.py

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
from reservations.models import Customer
from reservations.utils import send_sms

# 1. The "Micro Task" - Handles just ONE customer.
# rate_limit='2/s' tells Celery to process a maximum of 2 of these per second, 
# acting as an automatic throttle without blocking the queue!
@shared_task(rate_limit='2/s')
def send_single_blast_message(customer_id, channel, subject, plain_message, html_content):
    try:
        customer = Customer.objects.get(id=customer_id)
        
        # Send Email
        if channel in ['EMAIL', 'BOTH'] and customer.email:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[customer.email],
                fail_silently=True,
                html_message=html_content
            )
            
        # Send SMS (Careful with costs!)
        if channel in ['SMS', 'BOTH'] and customer.phone:
            # We strip HTML for SMS and keep it short
            sms_body = f"GOLDEN BAY: {subject}. {plain_message[:100]}... See email/site for details!"
            send_sms(customer.phone, sms_body)
            
    except Customer.DoesNotExist:
        pass


# 2. The "Master Task" - Instantly queues up the micro tasks.
@shared_task
def send_mass_blast(audience, channel, subject, html_content):
    customers = Customer.objects.all()
    
    if audience == 'VIP':
        customers = customers.filter(is_vip=True)
    elif audience == 'INACTIVE':
        # Future feature: Could filter by last_visit older than 6 months
        pass 
        
    plain_message = strip_tags(html_content)
    
    # "Fan-Out": We loop through the customers and push a tiny task to the queue for each one.
    # This loop finishes in less than a second, freeing up the worker to process them at its own pace!
    for customer in customers:
        send_single_blast_message.delay(
            customer.id, 
            channel, 
            subject, 
            plain_message, 
            html_content
        )
        
    return f"Successfully queued {customers.count()} messages for sending."