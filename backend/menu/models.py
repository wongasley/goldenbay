from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    name_zh = models.CharField(max_length=100, blank=True, null=True, verbose_name="Chinese Name")
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order']

    def __str__(self):
        return self.name
    
class CookingMethod(models.Model):
    name = models.CharField(max_length=100)
    name_zh = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name
    
class MenuItem(models.Model):
    category = models.ForeignKey(Category, related_name='items', on_delete=models.CASCADE)
    code = models.CharField(max_length=20, blank=True, null=True, help_text="e.g., BA01")
    name = models.CharField(max_length=200)
    name_zh = models.CharField(max_length=200, blank=True, null=True, verbose_name="Chinese Name")
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    cooking_methods = models.ManyToManyField(CookingMethod, blank=True, related_name='menu_items')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else self.name

class MenuItemPrice(models.Model):
    menu_item = models.ForeignKey(MenuItem, related_name='prices', on_delete=models.CASCADE)
    size = models.CharField(max_length=50, default='Regular', help_text="e.g., S, M, L, Half, Whole")
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_seasonal = models.BooleanField(default=False, help_text="If checked, price will show as 'Seasonal Price'")

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.menu_item.name} - {self.size}"