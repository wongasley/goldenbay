// goldenbay-mobile/src/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HOW TO SET YOUR URL:
// 1. If using Android Studio Emulator: use 'http://10.0.2.2:8000'
// 2. If using a physical phone with Expo Go: use your computer's local Wi-Fi IP (e.g., 'http://192.168.1.15:8000')
// 3. For Production: use 'https://goldenbay.com.ph'

const BACKEND_URL = 'http://10.0.2.2:8000'; 

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

// Attach Token to every request
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gb_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default axiosInstance;