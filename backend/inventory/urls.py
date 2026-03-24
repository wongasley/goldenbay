from django.urls import path
from .views import (LocationListCreateView, LocationDetailView, RackListCreateView, 
                    RackDetailView, UOMListCreateView, UOMDetailView, ProductListView, 
                    ProductCreateView, ProductUpdateView, StockLevelListView, 
                    ProductLookupView, DocumentCreateView, DocumentApproveView)

urlpatterns = [
    # Settings Endpoints
    path('locations/', LocationListCreateView.as_view()),
    path('locations/<int:pk>/', LocationDetailView.as_view()),
    path('racks/', RackListCreateView.as_view()),
    path('racks/<int:pk>/', RackDetailView.as_view()),
    path('uom/', UOMListCreateView.as_view()),
    path('uom/<int:pk>/', UOMDetailView.as_view()),
    
    # Inventory & Catalog Endpoints
    path('products/', ProductListView.as_view()), # <--- THIS FIXES THE FRONTEND CRASH
    path('products/lookup/', ProductLookupView.as_view()),
    path('products/create/', ProductCreateView.as_view()), 
    path('products/<int:pk>/update/', ProductUpdateView.as_view()),
    
    path('stock/', StockLevelListView.as_view()),
    
    # Document Endpoints
    path('documents/create/', DocumentCreateView.as_view()),
    path('documents/<int:pk>/approve/', DocumentApproveView.as_view()),
]