from django.db import models

class EventGallery(models.Model):
    event_code = models.CharField(max_length=20, unique=True)
    event_name = models.CharField(max_length=200)

    class Meta:
        verbose_name_plural = "Event Galleries"

    def __str__(self):
        return self.event_name
    
class EventPhoto(models.Model):
    gallery = models.ForeignKey(EventGallery, related_name='photos', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='event_uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)