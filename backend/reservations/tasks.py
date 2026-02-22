from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import os
from .utils import send_sms
from .models import Reservation 

@shared_task
def send_new_booking_notifications(reservation_id):
    """ ASYNCHRONOUS: Fired by Celery when a NEW booking is created """
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
        if admin_numbers_env:
            admin_numbers = [num.strip() for num in admin_numbers_env.split(',') if num.strip()]
            admin_sms_body = f"New Booking: {reservation.customer_name} ({reservation.pax} pax) for {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')}. Area: {area_name}. Check Dashboard."
            
            for num in admin_numbers:
                send_sms(num, admin_sms_body)

        # 2. NOTIFY THE CUSTOMER
        if reservation.customer_email and '@' in reservation.customer_email:
            customer_context = {
                'name': reservation.customer_name,
                'status': 'PENDING',
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id
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
        if len(contact_digits) >= 10:
             sms_body = f"Hi {reservation.customer_name}, we received your booking request for {reservation.pax} pax on {reservation.date.strftime('%b %d')}. Our team is reviewing availability and will confirm during operating hours. - GOLDENBAY"
             send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Celery Task Error (New Booking): {e}")

@shared_task
def send_status_update_notifications(reservation_id, new_status):
    """ ASYNCHRONOUS: Fired by Celery when an ADMIN confirms or cancels a booking """
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        # 1. SEND HTML EMAIL (If email exists)
        if reservation.customer_email and '@' in reservation.customer_email and new_status in ['CONFIRMED', 'CANCELLED']:
            context = {
                'name': reservation.customer_name,
                'status': new_status,
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id
            }
            html_message = render_to_string('emails/confirmation.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject=f'Reservation {new_status.capitalize()} - Golden Bay',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                fail_silently=False,
                html_message=html_message
            )
            
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10:
             if new_status == 'CONFIRMED':
                 sms_body = f"Great news, {reservation.customer_name}! Your table for {reservation.pax} on {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')} is CONFIRMED. See you soon! - GOLDENBAY"
                 send_sms(reservation.customer_contact, sms_body)
             elif new_status == 'CANCELLED':
                 sms_body = f"Hi {reservation.customer_name}, your reservation request has been cancelled. Please call (02) 8804-0332 to reschedule. - GOLDENBAY"
                 send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Celery Task Error (Status Update): {e}")

@shared_task
def send_booking_modification_notifications(reservation_id):
    """ ASYNCHRONOUS: Fired when an admin edits a booking's room, date, or time """
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        area_name = reservation.dining_area.name if reservation.dining_area else "Main Dining Hall"
        
        # 1. SEND HTML EMAIL
        if reservation.customer_email and '@' in reservation.customer_email:
            context = {
                'name': reservation.customer_name,
                'status': 'UPDATED', # Triggers the "Updated" block in your template
                'date': reservation.date.strftime('%B %d, %Y'),
                'time': reservation.time.strftime('%I:%M %p'),
                'pax': reservation.pax,
                'area': area_name,
                'id': reservation.id
            }
            html_message = render_to_string('emails/confirmation.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject='Reservation Updated - Golden Bay',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reservation.customer_email],
                fail_silently=False,
                html_message=html_message
            )
            
        # 2. SEND SMS
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10:
             sms_body = f"Hi {reservation.customer_name}, your Golden Bay reservation has been UPDATED. You are now booked for {reservation.pax} pax on {reservation.date.strftime('%b %d')} at {reservation.time.strftime('%I:%M %p')} in the {area_name}. - GOLDENBAY"
             send_sms(reservation.customer_contact, sms_body)

    except Exception as e:
        print(f"Celery Task Error (Modification): {e}")

@shared_task
def send_post_dining_feedback(reservation_id):
    """ ASYNCHRONOUS: Fired 2 hours after a reservation is marked COMPLETED """
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        
        # We only send if they actually showed up and completed the dining experience
        if reservation.status != 'COMPLETED':
            return
            
        review_link = "https://g.page/r/CVOD2Qu6cEbVEAE/review"
        
        # 1. SEND SMS
        contact_digits = ''.join(filter(str.isdigit, str(reservation.customer_contact)))
        if len(contact_digits) >= 10:
             sms_body = f"Hi {reservation.customer_name}, thank you for dining at Golden Bay today! We hope you enjoyed your meal. If you have a moment, we'd love your feedback: {review_link} - GOLDENBAY"
             send_sms(reservation.customer_contact, sms_body)

        # 2. SEND EMAIL (Optional fallback)
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