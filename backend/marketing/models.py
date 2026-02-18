from django.db import models

class Post(models.Model):
    TYPE_CHOICES = [
        ('BLOG', 'News & Events'),
        ('PROMO', 'Promotion'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, help_text="URL friendly name (e.g., chinese-new-year-promo)")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    content = models.TextField()
    image = models.ImageField(upload_to='marketing_uploads/')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.title}"