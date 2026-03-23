# backend/inventory/permissions.py
from rest_framework.permissions import BasePermission

class IsInventoryManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_superuser or request.user.groups.filter(name='Inventory Manager').exists()))

class IsInventoryOfficer(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_superuser or request.user.groups.filter(name__in=['Inventory Manager', 'Inventory Officer']).exists()))