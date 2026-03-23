from django.urls import path
from .views import LocationListView, ProductCreateView, StockLevelListView, ProductLookupView, DocumentCreateView, DocumentApproveView

urlpatterns = [
    path('locations/', LocationListView.as_view()),
    path('stock/', StockLevelListView.as_view()),
    path('products/lookup/', ProductLookupView.as_view()),
    path('products/create/', ProductCreateView.as_view()), # <--- NEW ROUTE
    path('documents/create/', DocumentCreateView.as_view()),
    path('documents/<int:pk>/approve/', DocumentApproveView.as_view()),
]