import type { Category } from './category';

export interface ArtistProfile {
  id: number;
  primary_discipline: string | null;
  specialties: string[] | null;
  location: string | null;
  external_links: Record<string, string | null> | null;
  onboarding_completed: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  onboarding_completed: boolean;
  artist_profile: ArtistProfile | null;
  categories: Category[];
  created_at: string;
}

export interface OnboardingPayload {
  category_ids: number[];
  interest_ids: number[];
  bio: string | null;
}

export interface AuthResponse {
  data: AuthUser;
  token: string;
}

export interface MeResponse {
  data: AuthUser;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}
