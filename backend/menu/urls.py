# backend/menu/urls.py
from django.urls import path
from .views import MenuListView, AdminMenuListView, AdminMenuItemUpdateView, AdminMenuItemPriceUpdateView

urlpatterns = [
    path('', MenuListView.as_view(), name='api_menu_list'),
    
    # Admin Management Endpoints
    path('manage/all/', AdminMenuListView.as_view(), name='api_admin_menu_list'),
    path('manage/items/<int:pk>/', AdminMenuItemUpdateView.as_view(), name='api_admin_item_update'),
    path('manage/prices/<int:pk>/', AdminMenuItemPriceUpdateView.as_view(), name='api_admin_price_update'),
]