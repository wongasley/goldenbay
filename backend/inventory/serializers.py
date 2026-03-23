from rest_framework import serializers
from .models import Location, Product, StockLevel, InventoryDocument, DocumentLineItem

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class StockLevelSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    base_unit = serializers.CharField(source='product.base_unit', read_only=True)
    rack_name = serializers.CharField(source='rack.name', read_only=True, default='Unassigned')

    class Meta:
        model = StockLevel
        fields = '__all__'

class DocumentLineItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    base_unit = serializers.CharField(source='product.base_unit', read_only=True)
    
    class Meta:
        model = DocumentLineItem
        fields = ['id', 'product', 'product_name', 'base_unit', 'quantity']

class InventoryDocumentSerializer(serializers.ModelSerializer):
    items = DocumentLineItemSerializer(many=True, read_only=True)
    source_name = serializers.CharField(source='source_location.name', read_only=True)
    dest_name = serializers.CharField(source='destination_location.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = InventoryDocument
        fields = '__all__'