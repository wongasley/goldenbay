from rest_framework import generics
from django.db.models import Prefetch
from .models import Category, MenuItem
from .serializers import CategorySerializer

class MenuListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    
    def get_queryset(self):
        # 1. Create a query for Items that is sorted by 'code' (Ascending: A-Z, 0-9)
        #    We also prefetch 'prices' here to ensure the nested data loads fast.
        sorted_items = MenuItem.objects.order_by('code').prefetch_related('prices')

        # 2. Fetch Categories sorted by their manual 'order'
        #    And inject our sorted_items query into the 'items' relationship
        return Category.objects.prefetch_related(
            Prefetch('items', queryset=sorted_items)
        ).all().order_by('order')