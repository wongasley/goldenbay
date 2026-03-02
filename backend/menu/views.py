# backend/menu/views.py
from rest_framework import generics
from django.db.models import Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Category, MenuItem, MenuItemPrice
from .serializers import CategorySerializer, AdminMenuItemUpdateSerializer, AdminMenuItemPriceUpdateSerializer

# --- EXISTING PUBLIC VIEW ---
class MenuListView(generics.ListAPIView):
    serializer_class = CategorySerializer

    @method_decorator(cache_page(60 * 15))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        sorted_items = MenuItem.objects.order_by('code').prefetch_related('prices')
        return Category.objects.prefetch_related(
            Prefetch('items', queryset=sorted_items)
        ).all().order_by('order')

# --- NEW ADMIN VIEWS ---

class AdminMenuListView(generics.ListAPIView):
    """ Uncached view for the React Admin Panel """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        sorted_items = MenuItem.objects.order_by('code').prefetch_related('prices')
        return Category.objects.prefetch_related(
            Prefetch('items', queryset=sorted_items)
        ).all().order_by('order')

class AdminMenuItemUpdateView(generics.UpdateAPIView):
    """ Updates Image and Availability """
    queryset = MenuItem.objects.all()
    serializer_class = AdminMenuItemUpdateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_update(self, serializer):
        # --- BLOCK RECEPTIONISTS ---
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Admin', 'Supervisor']).exists()):
            raise PermissionDenied("Only Supervisors and Admins can manage the menu.")
            
        serializer.save()
        cache.clear()

class AdminMenuItemPriceUpdateView(generics.UpdateAPIView):
    """ Updates specific Prices and Seasonal flags """
    queryset = MenuItemPrice.objects.all()
    serializer_class = AdminMenuItemPriceUpdateSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        # --- BLOCK RECEPTIONISTS ---
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Admin', 'Supervisor']).exists()):
            raise PermissionDenied("Only Supervisors and Admins can manage the menu.")
            
        serializer.save()
        cache.clear()