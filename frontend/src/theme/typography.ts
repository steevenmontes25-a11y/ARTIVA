import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  useFonts as useSpaceGroteskFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

// Space Grotesk: títulos, nombres de usuario, headers de sección.
// Inter: texto de cuerpo, inputs, descripciones, captions.

interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface Typography {
  h1: TextStyleToken;
  h2: TextStyleToken;
  h3: TextStyleToken;
  /** Nombres de usuario / handles — Space Grotesk, tamaño de cuerpo. */
  username: TextStyleToken;
  /** Nombre completo en el header de perfil — Space Grotesk Medium, 17px. */
  profileName: TextStyleToken;
  body: TextStyleToken;
  bodyMedium: TextStyleToken;
  bodySmall: TextStyleToken;
  caption: TextStyleToken;
  /** Etiquetas de botones — Inter SemiBold. */
  button: TextStyleToken;
}

export const typography: Typography = {
  h1: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16, lineHeight: 22 },
  username: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, lineHeight: 20 },
  profileName: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17, lineHeight: 22 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 21 },
  bodySmall: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  button: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20 },
};

/** Carga ambas familias tipográficas. Usar una sola vez en el layout raíz. */
export function useAppFonts(): [boolean, Error | null] {
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [spaceGroteskLoaded, spaceGroteskError] = useSpaceGroteskFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  return [interLoaded && spaceGroteskLoaded, interError ?? spaceGroteskError ?? null];
}
