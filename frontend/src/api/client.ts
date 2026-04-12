import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Default to localhost for Android emulator, or actual IP if on physical device
export const BASE_URL = 'http://10.0.2.2:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
