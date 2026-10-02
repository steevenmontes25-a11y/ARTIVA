import { create } from 'zustand';

import { loginRequest, logoutRequest, meRequest, registerRequest } from '../api/auth';
import { AUTH_TOKEN_KEY } from '../api/client';
import { extractErrorMessage } from '../api/errors';
import { secureStorage } from '../api/secureStorage';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** true una vez que hydrate() terminó de resolver la sesión guardada. */
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  /** Limpia la sesión local (token + estado) sin llamar al backend. */
  clearSession: () => Promise<void>;
  clearError: () => void;
  /** Reemplaza el usuario en el store (p. ej. tras completar el onboarding). */
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  login: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const { data: user, token } = await loginRequest(payload);
      await secureStorage.setItem(AUTH_TOKEN_KEY, token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error) });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const { data: user, token } = await registerRequest(payload);
      await secureStorage.setItem(AUTH_TOKEN_KEY, token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error) });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await logoutRequest();
    } catch {
      // El token ya podía ser inválido del lado del servidor; igual limpiamos localmente.
    } finally {
      await get().clearSession();
      set({ isLoading: false });
    }
  },

  hydrate: async () => {
    const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      set({ isHydrated: true });
      return;
    }

    try {
      const user = await meRequest();
      set({ user, token, isAuthenticated: true, isHydrated: true });
    } catch {
      await secureStorage.deleteItem(AUTH_TOKEN_KEY);
      set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
    }
  },

  clearSession: async () => {
    await secureStorage.deleteItem(AUTH_TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),
}));
