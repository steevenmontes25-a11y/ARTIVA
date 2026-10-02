export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accentPrimary: string;
  accentSecondary: string;
  error: string;
  /** Blanco/negro fijo, útil sobre superficies de color sólido (ej. texto de un botón accentPrimary). */
  onAccent: string;
  // Acentos ampliados: uso puntual (menú circular, fila de interacciones del
  // feed) — el resto de la app (formularios, listas) sigue usando solo
  // accentPrimary/accentSecondary para no saturar de color pantallas que
  // deben verse sobrias. Mismos valores en ambos modos (no derivados).
  accentPurple: string;
  accentCoral: string;
  accentAmber: string;
  accentPink: string;
  // Chip de disciplina del perfil: fijo (dark maroon + texto claro) igual en
  // los dos modos — es una "etiqueta de color" tipo badge, no una superficie
  // que deba adaptarse a texto claro/oscuro del theme.
  disciplineChipBackground: string;
  disciplineChipText: string;
  /** Fondo destacado de la columna "Colaboraciones" en la fila de stats del perfil. */
  statHighlightBackground: string;
}

const expandedAccents = {
  accentPurple: '#AFA9EC',
  accentCoral: '#F0997B',
  accentAmber: '#EF9F27',
  accentPink: '#ED93B1',
  disciplineChipBackground: '#4A1B0C',
  disciplineChipText: '#F5C4B3',
  statHighlightBackground: '#0F2F27',
};

export const darkColors: ColorTokens = {
  background: '#0B0E14',
  surface: '#141821',
  surfaceElevated: '#1C212C',
  textPrimary: '#E8EAED',
  textSecondary: '#8B93A3',
  border: '#252B38',
  accentPrimary: '#3D7FFF',
  accentSecondary: '#00D9A3',
  error: '#FF5470',
  onAccent: '#FFFFFF',
  ...expandedAccents,
};

export const lightColors: ColorTokens = {
  background: '#FAFBFC',
  surface: '#FFFFFF',
  // No especificado por el spec de diseño; derivado del mismo background para
  // mantener una elevación sutil consistente con el resto de la paleta clara.
  surfaceElevated: '#F1F3F6',
  textPrimary: '#0B0E14',
  textSecondary: '#5C6470',
  // Idem: borde neutro coherente con background/surface claros.
  border: '#E2E5EA',
  accentPrimary: '#3D7FFF',
  accentSecondary: '#00D9A3',
  error: '#FF5470',
  onAccent: '#FFFFFF',
  ...expandedAccents,
};
