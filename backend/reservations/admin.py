from django.contrib import admin
from .models import Customer, DiningArea, PointTransaction, Reservation, RewardItem

@admin.register(DiningArea)
class DiningAreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'area_type', 'capacity', 'has_ktv', 'is_active')
    list_filter = ('area_type', 'has_ktv', 'has_restroom')

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'date', 'session', 'dining_area', 'status')
    list_filter = ('date', 'session', 'status', 'dining_area')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'visit_count', 'is_vip')
    search_fields = ('name', 'phone', 'email')
    list_filter = ('is_vip',)

@admin.register(RewardItem)
class RewardItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'points_required', 'is_active')
    list_filter = ('is_active',)

@admin.register(PointTransaction)
class PointTransactionAdmin(admin.ModelAdmin):
    list_display = ('customer', 'transaction_type', 'points', 'amount_spent', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('customer__name', 'customer__phone')
    readonly_fields = ('created_at',)