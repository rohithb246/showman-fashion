from django.contrib import admin
from products.models import (
    Category, SubCategory, Product, ProductImage, ProductVariant,
    Size, Color, Inventory, Review, Coupon, Banner,
)

admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(ProductVariant)
admin.site.register(Size)
admin.site.register(Color)
admin.site.register(Inventory)
admin.site.register(Review)
admin.site.register(Coupon)
admin.site.register(Banner)
