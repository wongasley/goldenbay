from django.contrib import admin
from .models import Location, Product, StockLevel, InventoryDocument, DocumentLineItem

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_storage', 'is_department')
    list_filter = ('is_storage', 'is_department')
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'barcode', 'box_barcode', 'base_unit', 'units_per_box', 'cost_price')
    search_fields = ('name', 'brand', 'barcode', 'box_barcode')
    list_filter = ('brand',)

@admin.register(StockLevel)
class StockLevelAdmin(admin.ModelAdmin):
    list_display = ('product', 'location', 'quantity')
    list_filter = ('location',)
    search_fields = ('product__name', 'product__barcode')
    autocomplete_fields = ['product'] # Makes searching for products much faster

class DocumentLineItemInline(admin.TabularInline):
    model = DocumentLineItem
    extra = 1
    autocomplete_fields = ['product']

@admin.register(InventoryDocument)
class InventoryDocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'doc_type', 'status', 'source_location', 'destination_location', 'created_by', 'created_at')
    list_filter = ('doc_type', 'status', 'created_at', 'source_location', 'destination_location')
    search_fields = ('id', 'notes')
    readonly_fields = ('created_at',)
    inlines = [DocumentLineItemInline]