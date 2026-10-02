import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';

import { useAmbientBackgroundStore } from '../store/ambientBackgroundStore';

/**
 * Fija el fondo ambiental de escritorio (ver AmbientBackground.tsx /
 * WebFrame.tsx) mientras esta pantalla está enfocada. Pasa `null` en
 * pantallas sin imagen relevante (auth, formularios, placeholders) para caer
 * al color sólido del theme.
 *
 * `imageUrl` puede cambiar mientras la pantalla sigue enfocada (p. ej. el
 * feed al hacer scroll entre posts) — el efecto reacciona a eso, y también
 * se re-sincroniza cada vez que la pantalla vuelve a tomar foco (p. ej. al
 * volver de otro tab que dejó otro valor en el store global).
 *
 * Sin costo real en nativo/móvil angosto: el store existe igual ahí, pero
 * nada lo lee para renderizar nada (ver AmbientBackground.tsx).
 */
export function useAmbientBackground(imageUrl: string | null): void {
  const isFocused = useIsFocused();
  const setAmbientImage = useAmbientBackgroundStore((state) => state.setAmbientImage);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    setAmbientImage(imageUrl);
  }, [isFocused, imageUrl, setAmbientImage]);
}
