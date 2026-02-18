from django.contrib import admin
from .models import DiningArea, Reservation

@admin.register(DiningArea)
class DiningAreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'area_type', 'capacity', 'has_ktv', 'is_active')
    list_filter = ('area_type', 'has_ktv', 'has_restroom')

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'date', 'session', 'dining_area', 'status')
    list_filter = ('date', 'session', 'status', 'dining_area')