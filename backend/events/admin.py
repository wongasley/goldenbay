from django.contrib import admin
from .models import EventGallery, EventPhoto

class EventPhotoInline(admin.TabularInline):
    model = EventPhoto
    extra = 1

class EventGalleryAdmin(admin.ModelAdmin):
    inlines = [EventPhotoInline]

admin.site.register(EventGallery, EventGalleryAdmin)