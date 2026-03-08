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
    // Added Owner
    return role === 'Admin' || role === 'Supervisor';
};

export const canDeleteCustomer = () => {
    const role = getUserRole();
    // Added Owner
    return role === 'Admin';
};

export const canManageMarketing = () => {
    const role = getUserRole();
    // Added Owner
    return role === 'Admin';
};

export const canManageMenu = () => {
    const role = getUserRole();
    // Added Owner
    return role === 'Admin' || role === 'Supervisor';
};