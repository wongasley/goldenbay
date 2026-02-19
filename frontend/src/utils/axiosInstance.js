import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
});

// Request Interceptor: Add Token to every request
axiosInstance.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle 401 Token Expiry
axiosInstance.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                // Ask backend for a new access token
                const response = await axios.post(`${BACKEND_URL}/api/token/refresh/`, {
                    refresh: refreshToken
                });

                // Save new token
                localStorage.setItem('accessToken', response.data.access);

                // Retry the original failed request with new token
                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // If refresh fails (e.g. refresh token expired), force logout
                console.error("Session expired", refreshError);
                localStorage.clear();
                window.location.href = '/login';
            }
        } else {
            // No refresh token available
            localStorage.clear();
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default axiosInstance;