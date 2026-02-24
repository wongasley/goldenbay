from django.db import models

class SystemSetting(models.Model):
    enable_sms_notifications = models.BooleanField(
        default=True,
        help_text="Uncheck this to completely disable all SMS sending globally (useful for testing)."
    )

    def save(self, *args, **kwargs):
        # If a setting row already exists and we are trying to create a new one, 
        # force it to update the existing row instead.
        if SystemSetting.objects.exists() and not self.pk:
            self.pk = SystemSetting.objects.first().pk
        super(SystemSetting, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass # Prevent accidental deletion

    @classmethod
    def load(cls):
        # Safely get the first object, regardless of what its Primary Key is
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create()
        return obj

    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return "Global System Settings"