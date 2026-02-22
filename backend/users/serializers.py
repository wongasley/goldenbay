# backend/users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        
        # Determine the user's highest role. 
        # Default to 'Receptionist' if no group is assigned.
        role = 'Receptionist'
        if user.is_superuser:
            role = 'Admin'
        elif user.groups.filter(name='Supervisor').exists():
            role = 'Supervisor'
        elif user.groups.filter(name='Admin').exists():
            role = 'Admin'
            
        token['role'] = role

        return token