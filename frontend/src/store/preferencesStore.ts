import { create } from 'zustand';

import { secureStorage } from '../api/secureStorage';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'artiva_theme_preference';

interface PreferencesState {
  /** 'system' respeta el modo del SO (default); 'light'/'dark' lo fuerza. */
  themePreference: ThemePreference;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  themePreference: 'system',
  isHydrated: false,

  hydrate: async () => {
    const stored = await secureStorage.getItem(THEME_PREFERENCE_KEY);
    set({ themePreference: isThemePreference(stored) ? stored : 'system', isHydrated: true });
  },

  setThemePreference: async (preference) => {
    set({ themePreference: preference });
    await secureStorage.setItem(THEME_PREFERENCE_KEY, preference);
  },
}));
