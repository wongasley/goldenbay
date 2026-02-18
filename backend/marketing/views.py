from rest_framework import generics
from .models import Post
from .serializers import PostSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

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
    permission_classes = [IsAuthenticated] # Secure this!
    parser_classes = [MultiPartParser, FormParser]

class AdminPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser]