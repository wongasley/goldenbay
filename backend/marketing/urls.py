from django.urls import path
from .views import AdminPostDetailView, AdminPostListCreateView, PublicPostListView, PostDetailView

urlpatterns = [
    path('', PublicPostListView.as_view()),
    path('<slug:slug>/', PostDetailView.as_view()),
    path('manage/all/', AdminPostListCreateView.as_view()),
    path('manage/<int:id>/', AdminPostDetailView.as_view()),
]