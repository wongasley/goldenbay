from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from datetime import date, datetime, timedelta
from django.db.models import Q
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import os
from .utils import send_sms
from .models import Customer, Reservation 

def generate_ics(reservation):
    start_dt = datetime.combine(reservation.date, reservation.time)
    end_dt = start_dt + timedelta(hours=2)
    dtstart = start_dt.strftime("%Y%m%dT%H%M%S")
    dtend = end_dt.strftime("%Y%m%dT%H%M%S")
    now = datetime.now().strftime("%Y%m%dT%H%M%S")
    area_name = reservation.dining_area.name if reservation.dining_area else 'Main Dining Hall'
    
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Golden Bay Restaurant//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:{now}
DTSTART;TZID=Asia/Manila:{dtstart}
DTEND;TZID=Asia/Manila:{dtend}
SUMMARY:Golden Bay Reservation ({reservation.pax} Pax)
LOCATION:{area_name}, Golden Bay Fresh Seafood Restaurant, Macapagal Blvd, Pasay City
DESCRIPTION:Reservation for {reservation.customer_name}.\\nContact: {reservation.customer_contact}\\nRef: #{reservation.id}\\nWe look forward to serving you.
END:VEVENT
END:VCALENDAR"""
    return ics_content

@shared_task
def send_new_booking_notifications(reservation_id, send_sms_flag=True, notify_customer=True):
    try:
        reservation = Reservation.objects.get(id=reservation_id)
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
            recipient_list=['marketing@goldenbay.com.ph'], 
            html_message=admin_html,
            fail_silently=False,
        )

        admin_numbers_env = os.getenv('ADMIN_PHONE_NUMBERS')
        if admin_numbers_env and send_sms_flag:
            admin_numbers = [num.strip() for num in admin_numbers_env.split(',') if num.strip()]
            admin_sms_body = f"New Booking: {reservation.customer_name} ({reservation.pax} pax) for {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')}. Area: {area_name}. Check Dashboard."
            for num in admin_numbers:
                send_sms(num, admin_sms_body)

        # 2. NOTIFY THE CUSTOMER
        if notify_customer:
            if reservation.customer_email and '@' in reservation.customer_email:
                customer_context = {
                    'name': reservation.customer_name,
                    'status': 'PENDING',
                    'date': reservation.date.strftime('%B %d, %Y'),
                    'time': reservation.time.strftime('%I:%M %p'),
                    'pax': reservation.pax,
                    'area': area_name,
                    'id': reservation.id,
                    'manage_url': f"https://goldenbay.com.ph/manage-booking/{reservation.management_token}" # ADDED URL
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
            if len(contact_digits) >= 10 and send_sms_flag:
                 sms_body = f"Hi {reservation.customer_name}, we received your booking request for {reservation.pax} pax on {reservation.date.strftime('%b %d')}. Our team is reviewing availability and will confirm during operating hours. - GOLDENBAY"
                 send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Celery Task Error (New Booking): {e}")

@shared_task
def send_status_update_notifications(reservation_id, new_status, send_sms_flag=True):
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        if reservation.customer_email and '@' in reservation.customer_email and new_status in ['CONFIRMED', 'CANCELLED']:
            context = {
                'name': reservation.customer_name,
                'status': new_status,
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id,
                'manage_url': f"https://goldenbay.com.ph/manage-booking/{reservation.management_token}" # ADDED URL
            }
            html_message = render_to_string('emails/confirmation.html', context)
            plain_message = strip_tags(html_message)

            msg = EmailMultiAlternatives(
                subject=f'Reservation {new_status.capitalize()} - Golden Bay',
                body=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                to=[reservation.customer_email]
            )
            msg.attach_alternative(html_message, "text/html")
            
            if new_status == 'CONFIRMED':
                ics_data = generate_ics(reservation)
                msg.attach('GoldenBay_Reservation.ics', ics_data, 'text/calendar')

            msg.send(fail_silently=False)
            
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10 and send_sms_flag:
             if new_status == 'CONFIRMED':
                 sms_body = f"Great news, {reservation.customer_name}! Your table for {reservation.pax} on {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')} is CONFIRMED. Manage here: https://goldenbay.com.ph/manage-booking/{reservation.management_token}"
                 send_sms(reservation.customer_contact, sms_body)
             elif new_status == 'CANCELLED':
                 sms_body = f"Hi {reservation.customer_name}, your reservation request has been cancelled. Please call +63 917 580 7166 to reschedule. - GOLDENBAY"
                 send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Celery Task Error (Status Update): {e}")

@shared_task
def send_booking_modification_notifications(reservation_id, send_sms_flag=True):
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        if reservation.customer_email and '@' in reservation.customer_email:
            context = {
                'name': reservation.customer_name,
                'status': 'UPDATED',
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id,
                'manage_url': f"https://goldenbay.com.ph/manage-booking/{reservation.management_token}"
            }
            html_message = render_to_string('emails/confirmation.html', context)
            plain_message = strip_tags(html_message)

            msg = EmailMultiAlternatives(
                subject='Reservation Updated - Golden Bay',
                body=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                to=[reservation.customer_email]
            )
            msg.attach_alternative(html_message, "text/html")
            
            ics_data = generate_ics(reservation)
            msg.attach('GoldenBay_Reservation_Updated.ics', ics_data, 'text/calendar')
            
            msg.send(fail_silently=False)
            
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10 and send_sms_flag:
             sms_body = f"Hi {reservation.customer_name}, your Golden Bay reservation has been UPDATED. You are now booked for {reservation.pax} pax on {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')} in the {area_name}. - GOLDENBAY"
             send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Celery Task Error (Modification): {e}")

@shared_task
def send_post_dining_feedback(reservation_id, send_sms_flag=True):
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        if reservation.status != 'COMPLETED':
            return
            
        review_link = "https://g.page/r/CVOD2Qu6cEbVEAE/review"
        
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10 and send_sms_flag:
             sms_body = f"Hi {reservation.customer_name}, thank you for dining at Golden Bay today! We hope you enjoyed your meal. If you have a moment, we'd love your feedback: {review_link} - GOLDENBAY"
             send_sms(reservation.customer_contact, sms_body)

        if reservation.customer_email and '@' in reservation.customer_email:
            send_mail(
                subject='Thank you for dining with Golden Bay',
                message=f"Hi {reservation.customer_name},\n\nThank you for choosing Golden Bay. We'd love to hear about your experience!\n\nLeave a review: {review_link}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                fail_silently=True,
            )
            
    except Exception as e:
        print(f"Celery Task Error (Feedback Loop): {e}")

@shared_task
def send_we_miss_you_automation():
    today = date.today()
    ninety_days_ago = today - timedelta(days=90)
    one_eighty_days_ago = today - timedelta(days=180)

    eligible_customers = Customer.objects.filter(
        visit_count__gt=0,
        last_visit__lte=ninety_days_ago
    ).filter(
        Q(last_retention_sent__isnull=True) | Q(last_retention_sent__lte=one_eighty_days_ago)
    )

    for customer in eligible_customers:
        sent_any = False
        
        contact_digits = ''.join(filter(str.isdigit, str(customer.phone)))
        if len(contact_digits) >= 10:
            sms_body = f"Hi {customer.name}, we miss you at Golden Bay! It's been a while. Show this text for a complimentary dessert on your next dine-in visit with us. Call +63 917 580 7166 to reserve."
            send_sms(customer.phone, sms_body)
            sent_any = True
            
        if customer.email and '@' in customer.email:
            subject = "We miss you at Golden Bay!"
            context = {'name': customer.name}
            html_message = render_to_string('emails/we_miss_you.html', context)
            plain_message = strip_tags(html_message) 
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[customer.email],
                html_message=html_message,
                fail_silently=True,
            )
            sent_any = True
            
        if sent_any:
            customer.last_retention_sent = today
            customer.save(update_fields=['last_retention_sent'])

    return f"Processed retention campaign for {eligible_customers.count()} customers."

@shared_task
def send_birthday_promos():
    today = date.today()
    target_date = today + timedelta(days=7)
    current_year = today.year

    birthday_customers = Customer.objects.filter(
        date_of_birth__month=target_date.month,
        date_of_birth__day=target_date.day
    ).exclude(last_birthday_promo_year=current_year)

    for customer in birthday_customers:
        contact_digits = ''.join(filter(str.isdigit, str(customer.phone)))
        if len(contact_digits) >= 10:
            sms_body = f"Advance Happy Birthday, {customer.name}! 🎉 Celebrate your special day at Golden Bay. Show this text within your birthday month for a complimentary Longevity Peach Bun on us! Reserve at +63 917 580 7166"
            send_sms(customer.phone, sms_body)
            
            customer.last_birthday_promo_year = current_year
            customer.save(update_fields=['last_birthday_promo_year'])

    return f"Sent birthday promos to {birthday_customers.count()} customers."


@shared_task
def send_points_awarded_sms(customer_id, points_earned, total_points):
    try:
        customer = Customer.objects.get(id=customer_id)
        contact_digits = ''.join(filter(str.isdigit, str(customer.phone)))
        
        if len(contact_digits) >= 10:
            sms_body = f"Hi {customer.name}! You earned {points_earned} pts at Golden Bay today. Your new balance is {total_points} pts. View rewards at goldenbay.com.ph/rewards"
            send_sms(customer.phone, sms_body)
            
    except Exception as e:
        print(f"Celery Task Error (Points SMS): {e}")