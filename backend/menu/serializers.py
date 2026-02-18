from rest_framework import serializers
from .models import Category, MenuItem, MenuItemPrice, CookingMethod

class CookingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = CookingMethod
        fields = ['id', 'name', 'name_zh']

class MenuItemPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemPrice
        fields = ['id', 'size', 'price', 'is_seasonal']

class MenuItemSerializer(serializers.ModelSerializer):
    prices = MenuItemPriceSerializer(many=True, read_only=True)
    cooking_methods = CookingMethodSerializer(many=True, read_only=True) # <--- Added this
    image = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ['id', 'code', 'name', 'name_zh', 'description', 'image', 'is_available', 'prices', 'cooking_methods']

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'name_zh', 'items']