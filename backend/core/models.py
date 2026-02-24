from django.db import models

class SystemSetting(models.Model):
    enable_sms_notifications = models.BooleanField(
        default=True,
        help_text="Uncheck this to completely disable all SMS sending globally (useful for testing)."
    )

    def save(self, *args, **kwargs):
        # Forces this model to only ever have ONE row (ID=1)
        self.pk = 1
        super(SystemSetting, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Prevent accidental deletion of the settings row
        pass

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return "Global System Settings"