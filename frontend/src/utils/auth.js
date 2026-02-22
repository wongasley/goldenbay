// frontend/src/utils/auth.js
import { jwtDecode } from 'jwt-decode';

export const getUserRole = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
        const decoded = jwtDecode(token);
        return decoded.role || 'Receptionist'; // Default fallback
    } catch (error) {
        return null;
    }
};

export const canCancelBooking = () => {
    const role = getUserRole();
    return role === 'Supervisor' || role === 'Admin';
};

export const canManageMarketing = () => {
    const role = getUserRole();
    return role === 'Admin';
};