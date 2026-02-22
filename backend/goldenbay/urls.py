from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from marketing.views import dynamic_sitemap
from users.serializers import CustomTokenObtainPairSerializer

class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_scope = 'burst'
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/menu/', include('menu.urls')),         # <--- We will enable these soon
    path('api/reservations/', include('reservations.urls')), 
    path('api/marketing/', include('marketing.urls')),
    path('sitemap.xml', dynamic_sitemap, name='dynamic_sitemap'),
    # path('api/events/', include('events.urls')), 
    path('api/token/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Media files for development (Images)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)