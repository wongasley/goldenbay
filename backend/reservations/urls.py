from django.urls import path
from .views import AdminReservationDetailView, AdminReservationListView, AvailableRoomsView, ChatbotBookingWebhook, CustomerDetailView, CustomerListView, DashboardStatsView, LeadCaptureView, ReservationCreateView, VIPRoomListView

urlpatterns = [
    path('check/', AvailableRoomsView.as_view(), name='check_availability'),
    path('create/', ReservationCreateView.as_view(), name='create_reservation'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('manage/', AdminReservationListView.as_view()), 
    path('manage/<int:pk>/', AdminReservationDetailView.as_view()),
    path('customers/', CustomerListView.as_view()),
    path('customers/<int:id>/', CustomerDetailView.as_view()),
    path('rooms/', VIPRoomListView.as_view(), name='vip_room_list'),
    path('bot-webhook/', ChatbotBookingWebhook.as_view(), name='bot_webhook'),
    path('lead-capture/', LeadCaptureView.as_view(), name='lead_capture'),
]