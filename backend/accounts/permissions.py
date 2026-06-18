from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_admin_user
            and not request.user.is_blocked
        )


class IsFullAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and not request.user.is_blocked
            and (
                request.user.is_superuser
                or getattr(request.user, 'role', None) == request.user.Role.ADMIN
            )
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_user:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
