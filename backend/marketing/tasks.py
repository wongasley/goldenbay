# backend/marketing/tasks.py
from datetime import date, timedelta
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
from reservations.models import Customer, Reservation

# 1. The "Micro Task" - Handles just ONE customer's EMAIL.
@shared_task(rate_limit='2/s')
def send_single_blast_message(customer_id, subject, plain_message, html_content):
    try:
        customer = Customer.objects.get(id=customer_id)
        
        # Send Email Only
        if customer.email:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[customer.email],
                fail_silently=True,
                html_message=html_content
            )
            
    except Customer.DoesNotExist:
        pass


# 2. The "Master Task" - Instantly queues up the micro tasks.
@shared_task
def send_mass_blast(audience, subject, html_content):
    # Base query: Only get customers with an email address
    customers = Customer.objects.exclude(email__isnull=True).exclude(email__exact='')
    
    if audience == 'VIP':
        customers = customers.filter(is_vip=True)
        
    elif audience == 'INACTIVE_6M':
        # Hasn't visited in 6 months
        six_months_ago = date.today() - timedelta(days=180)
        customers = customers.filter(last_visit__lte=six_months_ago)
        
    elif audience == 'MANILA_VIP':
        # Customers who previously booked the high-end Manila VIP Room
        manila_phones = Reservation.objects.filter(
            dining_area__name="MANILA VIP Room", 
            status__in=['CONFIRMED', 'COMPLETED', 'SEATED']
        ).values_list('customer_contact', flat=True)
        customers = customers.filter(phone__in=manila_phones)
        
    plain_message = strip_tags(html_content)
    
    for customer in customers:
        send_single_blast_message.delay(customer.id, subject, plain_message, html_content)
        
    return f"Successfully queued {customers.count()} emails for sending."