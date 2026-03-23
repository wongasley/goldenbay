from django.contrib import admin
from .models import Location, Rack, Product, StockLevel, InventoryDocument, DocumentLineItem

# --- 1. ADD RACK INLINE ---
class RackInline(admin.TabularInline):
    model = Rack
    extra = 1 # Shows one blank row by default to quickly add a new rack

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_storage', 'is_department')
    list_filter = ('is_storage', 'is_department')
    search_fields = ('name',)
    inlines = [RackInline] # --- 2. ATTACH TO LOCATION ADMIN ---

@admin.register(Rack)
class RackAdmin(admin.ModelAdmin):
    list_display = ('name', 'location')
    list_filter = ('location',)
    search_fields = ('name', 'location__name')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'barcode', 'box_barcode', 'base_unit', 'units_per_box', 'cost_price')
    search_fields = ('name', 'brand', 'barcode', 'box_barcode')
    list_filter = ('brand',)

@admin.register(StockLevel)
class StockLevelAdmin(admin.ModelAdmin):
    list_display = ('product', 'location', 'rack', 'quantity') # Added rack to display
    list_filter = ('location', 'rack')
    search_fields = ('product__name', 'product__barcode')
    autocomplete_fields = ['product', 'rack'] # Makes searching faster

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