import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { useAmbientBackgroundStore } from '../store/ambientBackgroundStore';
import { useTheme } from '../theme/ThemeProvider';

const BLUR_RADIUS = 60;
const CROSSFADE_MS = 400;
const OVERLAY_COLOR = 'rgba(11,14,20,0.75)';

/**
 * Fondo ambiental de escritorio, al estilo Spotify/Apple Music: se monta
 * SOLO desde WebFrame (ya filtrado a web + viewport ancho, ver ese archivo)
 * detrás del contenedor centrado de 480px, y muestra una versión difuminada
 * y oscurecida del contenido que la pantalla activa esté mirando (post
 * actual del feed, avatar de perfil, etc. — ver useAmbientBackground e
 * hijos que llaman a setAmbientImage).
 *
 * El crossfade entre imágenes lo da gratis `transition` de expo-image (anima
 * automáticamente cuando cambia `source`, no hace falta manejarlo a mano).
 * Sin imagen (pantallas sin contenido visual relevante, p. ej. auth) cae a
 * un color sólido del theme — nunca queda vacío ni fuerza una imagen donde
 * no la hay.
 */
export function AmbientBackground(): React.JSX.Element {
  const { colors } = useTheme();
  const imageUrl = useAmbientBackgroundStore((state) => state.imageUrl);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={BLUR_RADIUS}
          transition={CROSSFADE_MS}
        />
      )}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: OVERLAY_COLOR,
  },
});
