import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

export type Role = 'athlete' | 'coach';

export interface AthletePayload {
  name: string; email: string; password: string; date_of_birth: string;
}

export interface CoachPayload extends AthletePayload {
  years_of_experience?: number; bio?: string;
  certification?: { uri: string; name: string; mimeType: string };
}

export interface MessageResponse { message: string; }

export interface LoginResponse {
  access_token: string; token_type: string; role: Role; name: string;
}

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.detail || err.response?.data?.message || 'Something went wrong.';
  }
  return 'Something went wrong.';
}

export const AuthService = {

  async sendAthleteCode(payload: AthletePayload): Promise<MessageResponse> {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('email', payload.email);
    form.append('password', payload.password);
    form.append('date_of_birth', payload.date_of_birth);
    try {
      const res = await axios.post<MessageResponse>(`${API_URL}/auth/register/athlete/send-code`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) { throw new Error(errorMessage(err)); }
  },

  async sendCoachCode(payload: CoachPayload): Promise<MessageResponse> {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('email', payload.email);
    form.append('password', payload.password);
    form.append('date_of_birth', payload.date_of_birth);
    if (payload.years_of_experience != null) form.append('years_of_experience', String(payload.years_of_experience));
    if (payload.bio) form.append('bio', payload.bio);
    if (payload.certification) {
      form.append('certification', {
        uri: payload.certification.uri,
        name: payload.certification.name,
        type: payload.certification.mimeType,
      } as unknown as Blob);
    }
    try {
      const res = await axios.post<MessageResponse>(`${API_URL}/auth/register/coach/send-code`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) { throw new Error(errorMessage(err)); }
  },

  async verifyCode(email: string, code: string): Promise<MessageResponse> {
    try {
      const res = await axios.post<MessageResponse>(`${API_URL}/auth/verify-code`, { email, code });
      return res.data;
    } catch (err) { throw new Error(errorMessage(err)); }
  },

  async resendCode(email: string): Promise<MessageResponse> {
    try {
      const res = await axios.post<MessageResponse>(`${API_URL}/auth/resend-code`, { email });
      return res.data;
    } catch (err) { throw new Error(errorMessage(err)); }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    try {
      const res = await axios.post<LoginResponse>(`${API_URL}/auth/login`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await SecureStore.setItemAsync('access_token', res.data.access_token);
      await SecureStore.setItemAsync('role',         res.data.role);
      await SecureStore.setItemAsync('user_name',    res.data.name);
      // For coaches, store their approval status from the JWT
      if (res.data.role === 'coach') {
        // If login succeeded, coach is approved (backend blocks pending/rejected)
        await SecureStore.setItemAsync('coach_status', 'approved');
      }
      return res.data;
    } catch (err) { throw new Error(errorMessage(err)); }
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('role');
    await SecureStore.deleteItemAsync('user_name');
    await SecureStore.deleteItemAsync('coach_status');
  },

  async getToken(): Promise<string | null> { return SecureStore.getItemAsync('access_token'); },
  async getRole():  Promise<Role | null>   { const r = await SecureStore.getItemAsync('role'); return (r as Role) ?? null; },
  async getName():  Promise<string | null> { return SecureStore.getItemAsync('user_name'); },
};
