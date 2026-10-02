import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '../store/preferencesStore';
import { darkColors, lightColors, type ColorTokens } from './colors';
import { typography, type Typography } from './typography';

export type ColorSchemeName = 'light' | 'dark';

export interface Theme {
  colorScheme: ColorSchemeName;
  colors: ColorTokens;
  typography: Typography;
}

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Respeta el modo oscuro/claro del sistema operativo por defecto
 * (useColorScheme). El usuario puede forzarlo manualmente después vía
 * usePreferencesStore().setThemePreference('light' | 'dark' | 'system'),
 * persistido entre sesiones.
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const themePreference = usePreferencesStore((state) => state.themePreference);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);

  useEffect(() => {
    hydratePreferences();
  }, [hydratePreferences]);

  // Oscuro es el default del spec de diseño: cualquier valor de systemScheme
  // que no sea explícitamente 'light' (incluyendo null/'unspecified' cuando
  // el SO no informa preferencia) cae en oscuro.
  const colorScheme: ColorSchemeName =
    themePreference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : themePreference;

  const value = useMemo<Theme>(
    () => ({
      colorScheme,
      colors: colorScheme === 'dark' ? darkColors : lightColors,
      typography,
    }),
    [colorScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error('useTheme() debe usarse dentro de <ThemeProvider>.');
  }

  return ctx;
}
