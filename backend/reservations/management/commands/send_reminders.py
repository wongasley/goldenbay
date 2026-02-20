import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from reservations.models import Reservation
from reservations.utils import send_sms
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

class Command(BaseCommand):
    help = 'Sends a reminder SMS and Email 4 hours before a confirmed reservation.'

    def handle(self, *args, **kwargs):
        now = timezone.localtime()
        
        # Get reservations for today and tomorrow that are CONFIRMED and haven't had a reminder sent
        reservations = Reservation.objects.filter(
            status='CONFIRMED',
            reminder_sent=False,
            date__in=[now.date(), (now + datetime.timedelta(days=1)).date()]
        )

        for res in reservations:
            # Combine the date and time fields into a timezone-aware datetime object
            res_datetime = timezone.make_aware(
                datetime.datetime.combine(res.date, res.time),
                timezone.get_current_timezone()
            )
            
            time_diff = res_datetime - now
            
            # Check if the reservation is between 3h 45m and 4h 15m away
            if datetime.timedelta(hours=3, minutes=45) <= time_diff <= datetime.timedelta(hours=4, minutes=15):
                
                self.stdout.write(f"Sending reminder to {res.customer_name} for {res.time}...")
                area_name = res.dining_area.name if res.dining_area else "Main Dining Hall"

                # 1. SEND SMS REMINDER - TEMPORARILY DISABLED
                contact_digits = ''.join(filter(str.isdigit, str(res.customer_contact)))
                if len(contact_digits) >= 10:
                    sms_body = f"Golden Bay Reminder: Hi {res.customer_name}, we look forward to seeing you today at {res.time.strftime('%I:%M %p')}! Please reply to this SMS or call (02) 8804-0332 for any changes."
                    send_sms(res.customer_contact, sms_body)

                # 2. SEND EMAIL REMINDER (Optional, but a nice touch)
                if res.customer_email and '@' in res.customer_email:
                    context = {
                        'name': res.customer_name,
                        'status': 'REMINDER', # We can reuse the confirmation template
                        'date': res.date.strftime('%B %d, %Y'),
                        'time': res.time.strftime('%I:%M %p'),
                        'pax': res.pax,
                        'area': area_name,
                        'id': res.id
                    }
                    html_message = render_to_string('emails/confirmation.html', context)
                    plain_message = strip_tags(html_message)

                    send_mail(
                        subject='Table Reminder - Golden Bay',
                        message=plain_message,
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[res.customer_email],
                        fail_silently=True,
                        html_message=html_message
                    )

                # Mark as sent so we don't message them again!
                res.reminder_sent = True
                res.save()

        self.stdout.write(self.style.SUCCESS('Successfully checked and sent reminders.'))