import { apiClient } from './client';
import type { AuthUser, MeResponse, OnboardingPayload } from '../types/auth';

export async function completeOnboarding(payload: OnboardingPayload): Promise<AuthUser> {
  const { data } = await apiClient.put<MeResponse>('/onboarding/complete', payload);
  return data.data;
}
