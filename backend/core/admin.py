from django.contrib import admin
from .models import SystemSetting

@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'enable_sms_notifications')
    
    # This removes the "Add" button if the settings row already exists
    def has_add_permission(self, request):
        return not SystemSetting.objects.exists()