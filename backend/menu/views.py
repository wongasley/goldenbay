from rest_framework import generics
from django.db.models import Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Category, MenuItem
from .serializers import CategorySerializer

class MenuListView(generics.ListAPIView):
    serializer_class = CategorySerializer

    @method_decorator(cache_page(60 * 15))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        # 1. Create a query for Items that is sorted by 'code' (Ascending: A-Z, 0-9)
        #    We also prefetch 'prices' here to ensure the nested data loads fast.
        sorted_items = MenuItem.objects.order_by('code').prefetch_related('prices')

        # 2. Fetch Categories sorted by their manual 'order'
        #    And inject our sorted_items query into the 'items' relationship
        return Category.objects.prefetch_related(
            Prefetch('items', queryset=sorted_items)
        ).all().order_by('order')