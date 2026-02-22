from rest_framework import generics, status
from django.http import HttpResponse
from .models import Post
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import PostSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from core.permissions import IsAdminUserOnly
from .tasks import send_mass_blast

class PublicPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Allow filtering by type via URL: /api/marketing/?type=PROMO
        queryset = Post.objects.filter(is_active=True)
        post_type = self.request.query_params.get('type')
        if post_type:
            queryset = queryset.filter(type=post_type)
        return queryset

class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

class AdminPostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    # RECEPTIONISTS CANNOT MANAGE MARKETING
    permission_classes = [IsAdminUserOnly] 
    parser_classes = [MultiPartParser, FormParser]

class AdminPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    # RECEPTIONISTS CANNOT MANAGE MARKETING
    permission_classes = [IsAdminUserOnly]
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser]

def dynamic_sitemap(request):
    """Generates an XML sitemap on the fly including all active posts"""
    posts = Post.objects.filter(is_active=True).order_by('-created_at')
    
    # 1. Your static React routes
    static_pages = [
        ('/', '1.0', 'weekly'),
        ('/menu', '0.9', 'weekly'),
        ('/reservations', '0.8', 'monthly'),
        ('/events', '0.8', 'monthly'),
        ('/vip-rooms', '0.8', 'monthly'),
        ('/contact', '0.8', 'monthly'), # Added your new Contact page!
        ('/news', '0.7', 'daily'),
        ('/about', '0.6', 'yearly'),
    ]
    
    base_url = "https://goldenbay.com.ph"
    
    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add Static Pages
    for path, priority, changefreq in static_pages:
        xml.append('  <url>')
        xml.append(f'    <loc>{base_url}{path}</loc>')
        xml.append(f'    <changefreq>{changefreq}</changefreq>')
        xml.append(f'    <priority>{priority}</priority>')
        xml.append('  </url>')
        
    # Add Dynamic Blog/Promo Posts
    for post in posts:
        xml.append('  <url>')
        xml.append(f'    <loc>{base_url}/news/{post.slug}</loc>')
        xml.append(f'    <lastmod>{post.created_at.strftime("%Y-%m-%d")}</lastmod>')
        xml.append('    <changefreq>weekly</changefreq>')
        xml.append('    <priority>0.7</priority>')
        xml.append('  </url>')
        
    xml.append('</urlset>')
    
    return HttpResponse('\n'.join(xml), content_type='application/xml')

class MarketingBlastView(APIView):
    permission_classes = [IsAdminUserOnly]

    def post(self, request):
        audience = request.data.get('audience', 'ALL')
        channel = request.data.get('channel', 'EMAIL')
        subject = request.data.get('subject')
        content = request.data.get('content')

        if not subject or not content:
            return Response({"error": "Subject and content required."}, status=status.HTTP_400_BAD_REQUEST)

        # Fire the Celery Task!
        send_mass_blast.delay(audience, channel, subject, content)
        
        return Response({"message": "Campaign is now sending in the background!"}, status=status.HTTP_200_OK)