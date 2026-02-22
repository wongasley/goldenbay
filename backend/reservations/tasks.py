from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import os
from .utils import send_sms
# IMPORTANT: We pass IDs instead of full Model Objects to Celery tasks
from .models import Reservation 

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