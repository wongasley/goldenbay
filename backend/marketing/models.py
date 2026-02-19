from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

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

    # Auto-Compress Image before saving
    def save(self, *args, **kwargs):
        try:
            this = Post.objects.get(id=self.id)
            image_changed = (this.image != self.image)
        except:
            image_changed = True

        if self.image and image_changed:
            img = Image.open(self.image)
            if img.mode in ("RGBA", "P"): 
                img = img.convert("RGB")
            # Resize if massively large
            img.thumbnail((1200, 1200))
            buffer = BytesIO()
            # Compress to WebP
            img.save(buffer, format='WEBP', quality=75)
            self.image = ContentFile(buffer.getvalue(), name=self.image.name.rsplit('.', 1)[0] + '.webp')

        super().save(*args, **kwargs)