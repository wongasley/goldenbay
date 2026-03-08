# backend/users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        
        # Determine the user's highest role. 
        role = 'Receptionist'
        if user.is_superuser:
            role = 'Admin'
        elif user.groups.filter(name='Owner').exists():
            role = 'Owner'
        elif user.groups.filter(name='Admin').exists():
            role = 'Admin'
        elif user.groups.filter(name='Supervisor').exists():
            role = 'Supervisor'
        elif user.groups.filter(name='Cashier').exists():
            role = 'Cashier'
            
        token['role'] = role

        return token