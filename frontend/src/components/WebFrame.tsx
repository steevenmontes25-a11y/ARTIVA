import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '../theme/ThemeProvider';
import { AmbientBackground } from './AmbientBackground';

const WEB_MAX_WIDTH = 480;
// Por debajo de este ancho el contenedor ya ocupa toda la ventana (ver
// `inner` sin `maxWidth` efectivo ahí) — mostrar fondo ambiental o el marco
// de tarjeta no tendría sentido, no hay margen donde verse.
const AMBIENT_BREAKPOINT = 500;

interface WebFrameProps {
  children: ReactNode;
}

/**
 * En web, centra toda la app dentro de un contenedor de ancho fijo tipo
 * "viewport de celular" (como hacen Instagram/WhatsApp Web) en vez de
 * estirar el contenido a todo el ancho de la ventana en pantallas anchas
 * (navegador de escritorio).
 *
 * Con viewport ancho (> 500px), el margen sobrante ya no es un color sólido
 * plano: se ve un fondo ambiental difuminado del contenido activo (estilo
 * Spotify/Apple Music de escritorio, ver AmbientBackground.tsx) y el
 * contenedor central gana un marco sutil (borde redondeado + sombra) para
 * leerse como una tarjeta flotando sobre ese fondo, no como texto suelto
 * sobre una imagen borrosa.
 *
 * Sin ningún efecto en nativo: Platform.OS !== 'web' devuelve los children
 * directo, sin wrapper — en el celular real la app sigue usando el ancho
 * completo de la pantalla exactamente como antes.
 */
export function WebFrame({ children }: WebFrameProps): React.JSX.Element {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const showCardFrame = width > AMBIENT_BREAKPOINT;

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      {showCardFrame && <AmbientBackground />}

      <View
        style={[
          styles.inner,
          { backgroundColor: colors.background },
          showCardFrame && styles.innerCard,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
  },
  innerCard: {
    marginVertical: 24,
    borderRadius: 16,
    overflow: 'hidden',
    // `boxShadow` (no shadow*/elevation): este estilo solo se aplica en la
    // rama web de arriba, nunca en nativo, así que no hace falta la versión
    // iOS/Android — y RN Web marca shadow* como deprecado a favor de esto.
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.35)',
  },
});
