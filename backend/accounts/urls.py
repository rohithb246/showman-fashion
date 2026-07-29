from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    CustomTokenObtainPairView, RegisterView, GoogleAuthView, LogoutView, ProfileView,
    ProfileDetailUpdateView, AddressListCreateView, AddressDetailView,
    NotificationListView, mark_notification_read, ChangePasswordView,
    ForgotPasswordView, ResetPasswordView, VerifyEmailView,
    AdminUserListView, AdminUserDetailView, ResendVerificationCodeView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/details/', ProfileDetailUpdateView.as_view(), name='profile_details'),
    path('addresses/', AddressListCreateView.as_view(), name='addresses'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address_detail'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', mark_notification_read, name='notification_read'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('verify-email/resend/', ResendVerificationCodeView.as_view(), name='resend_verification_code'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
]
