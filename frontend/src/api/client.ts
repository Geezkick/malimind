import axios from 'axios';
import { useAuthStore } from '../store/authStore';

import { Platform } from 'react-native';

// Handle different environments
const getBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000/api/v1';
  return 'http://10.0.2.2:3000/api/v1'; // Android emulator
};

export const BASE_URL = getBaseUrl();

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
