from django.contrib import admin
from .models import Category, MenuItem, MenuItemPrice

class MenuItemPriceInline(admin.TabularInline):
    model = MenuItemPrice
    extra = 0 # Don't show extra empty rows by default

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_zh', 'order')
    ordering = ('order',)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'is_available')
    list_filter = ('category', 'is_available')
    search_fields = ('name', 'code', 'name_zh')
    inlines = [MenuItemPriceInline]