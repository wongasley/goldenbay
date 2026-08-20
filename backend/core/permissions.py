# backend/core/permissions.py
from rest_framework.permissions import BasePermission

class IsSupervisorOrAdmin(BasePermission):
    """
    Allows access only to users in the 'Supervisor' or 'Admin' groups, or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            request.user.is_superuser or 
            request.user.groups.filter(name__in=['Supervisor', 'Admin']).exists()
        )

class IsAdminUserOnly(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.is_superuser or 
                request.user.groups.filter(name__in=['Admin', 'Supervisor']).exists()
            )
        )