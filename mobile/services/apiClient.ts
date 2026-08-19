import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

// Shared axios instance used by every domain service (clients, sessions,
// programs, messages, workouts, nutrition, progress, achievements,
// marketplace, ai-coach). Automatically attaches the stored bearer token.
export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      return `Request timed out. Is the backend running and reachable at ${API_URL}?`;
    }
    if (!err.response) {
      return `Can't reach the server at ${API_URL}. Check the backend is running and API_URL is correct for your device.`;
    }
    return err.response?.data?.detail || err.response?.data?.message || 'Something went wrong.';
  }
  return 'Something went wrong.';
}
