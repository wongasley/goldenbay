from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from deep_translator import GoogleTranslator
from bs4 import BeautifulSoup

def auto_translate_html(html_content, dest_lang):
    if not html_content: return ""
    soup = BeautifulSoup(html_content, 'html.parser')
    translator = GoogleTranslator(source='en', target=dest_lang)
    for element in soup.find_all(text=True):
        if element.strip():
            try:
                translated_text = translator.translate(element.string)
                element.replace_with(translated_text)
            except:
                pass # Fallback to original if translation fails
    return str(soup)

class Post(models.Model):
    TYPE_CHOICES = [
        ('BLOG', 'News & Events'),
        ('PROMO', 'Promotion'),
    ]

    title = models.CharField(max_length=200)
    title_zh = models.CharField(max_length=200, blank=True, null=True)
    title_zh_hant = models.CharField(max_length=200, blank=True, null=True)
    title_ja = models.CharField(max_length=200, blank=True, null=True)
    title_ko = models.CharField(max_length=200, blank=True, null=True)

    slug = models.SlugField(unique=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    
    content = models.TextField()
    content_zh = models.TextField(blank=True, null=True)
    content_zh_hant = models.TextField(blank=True, null=True)
    content_ja = models.TextField(blank=True, null=True)
    content_ko = models.TextField(blank=True, null=True)

    image = models.ImageField(upload_to='marketing_uploads/')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.title}"

    def save(self, *args, **kwargs):
        # 1. AUTO-TRANSLATE TITLE
        if not self.title_zh: self.title_zh = GoogleTranslator(source='en', target='zh-CN').translate(self.title)
        if not self.title_zh_hant: self.title_zh_hant = GoogleTranslator(source='en', target='zh-TW').translate(self.title)
        if not self.title_ja: self.title_ja = GoogleTranslator(source='en', target='ja').translate(self.title)
        if not self.title_ko: self.title_ko = GoogleTranslator(source='en', target='ko').translate(self.title)

        # 2. AUTO-TRANSLATE HTML CONTENT (Preserving formatting)
        if not self.content_zh: self.content_zh = auto_translate_html(self.content, 'zh-CN')
        if not self.content_zh_hant: self.content_zh_hant = auto_translate_html(self.content, 'zh-TW')
        if not self.content_ja: self.content_ja = auto_translate_html(self.content, 'ja')
        if not self.content_ko: self.content_ko = auto_translate_html(self.content, 'ko')

        # 3. IMAGE COMPRESSION
        try:
            this = Post.objects.get(id=self.id)
            image_changed = (this.image != self.image)
        except:
            image_changed = True

        if self.image and image_changed:
            img = Image.open(self.image)
            if img.mode in ("RGBA", "P"): img = img.convert("RGB")
            img.thumbnail((1200, 1200))
            buffer = BytesIO()
            img.save(buffer, format='WEBP', quality=75)
            self.image = ContentFile(buffer.getvalue(), name=self.image.name.rsplit('.', 1)[0] + '.webp')

        super().save(*args, **kwargs)