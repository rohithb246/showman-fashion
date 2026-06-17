from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import User, Profile, Address, Notification

admin.site.register(User, UserAdmin)
admin.site.register(Profile)
admin.site.register(Address)
admin.site.register(Notification)
