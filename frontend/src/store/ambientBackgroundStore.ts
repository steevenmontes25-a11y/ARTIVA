import { create } from 'zustand';

interface AmbientBackgroundState {
  /** URL de imagen a mostrar difuminada de fondo en web (viewport ancho). `null` = fallback a color sólido del theme. */
  imageUrl: string | null;
  setAmbientImage: (url: string | null) => void;
}

/**
 * Solo tiene efecto visual en web con viewport ancho (ver WebFrame.tsx /
 * AmbientBackground.tsx) — en nativo este store existe igual pero nadie lo
 * lee para renderizar nada, así que no tiene costo ni efecto ahí.
 *
 * Cada pantalla que le importa el fondo ambiental lo fija en su propio
 * useFocusEffect (imagen real o `null` si no aplica) — no hace falta
 * limpiarlo al perder foco: la loudspeaker screen que gane foco después
 * siempre pisa el valor con el suyo propio.
 */
export const useAmbientBackgroundStore = create<AmbientBackgroundState>((set) => ({
  imageUrl: null,
  setAmbientImage: (url) => set({ imageUrl: url }),
}));
