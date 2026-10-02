import { apiClient } from './client';
import type { AuthResponse, AuthUser, LoginPayload, MeResponse, RegisterPayload } from '../types/auth';

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  return data.data;
}
