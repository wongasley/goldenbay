from django.urls import path
from .views import AdminReservationDetailView, AdminReservationListView, AvailableRoomsView, AwardPointsView, ChatbotBookingWebhook, CustomerDetailView, CustomerListView, DashboardStatsView, LeadCaptureView, OwnerReportView, RedeemRewardView, ReservationCreateView, RewardItemListView, StaffRedemptionListView, StaffRedemptionUpdateView, VIPRoomListView

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
    path('rewards/', RewardItemListView.as_view(), name='reward_list'),
    path('rewards/redeem/', RedeemRewardView.as_view(), name='redeem_reward'),
    path('award-points/', AwardPointsView.as_view(), name='award_points'),
    path('manage/redemptions/', StaffRedemptionListView.as_view(), name='manage_redemptions'),
    path('manage/redemptions/<int:pk>/', StaffRedemptionUpdateView.as_view(), name='update_redemption'),
    path('reports/', OwnerReportView.as_view(), name='owner_reports'),
]