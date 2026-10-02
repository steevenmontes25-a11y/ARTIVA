import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import { secureStorage } from './secureStorage';
import { useAuthStore } from '../store/authStore';

export const AUTH_TOKEN_KEY = 'artiva_auth_token';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no está definida. Configúrala en el archivo .env del proyecto frontend.'
  );
}

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().clearSession();
      router.replace('/(auth)/login');
    }

    return Promise.reject(error);
  }
);
