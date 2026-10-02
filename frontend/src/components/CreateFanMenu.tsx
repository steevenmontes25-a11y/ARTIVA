import { useMemo, useState, type ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Imports profundos: ver la nota en FeedItem.tsx sobre por qué no se importa
// desde el barrel `lucide-react-native` (evita empaquetar ~1000 íconos).
import Camera from 'lucide-react-native/icons/camera';
import ImageIcon from 'lucide-react-native/icons/image';
import Music from 'lucide-react-native/icons/music';
import Pencil from 'lucide-react-native/icons/pencil';
import Piano from 'lucide-react-native/icons/piano';
import Video from 'lucide-react-native/icons/video';
import X from 'lucide-react-native/icons/x';

import { useTheme, type Theme } from '../theme/ThemeProvider';
import { AnimatedPressable } from './AnimatedPressable';
import { FanOutSatellite, type FanOutSatelliteConfig } from './FanOutSatellite';

const CENTER_SIZE = 80;
const CENTER_ICON_SIZE = 32;
const SATELLITE_SIZE = 56;
const SATELLITE_ICON_SIZE = 24;
const RADIUS = 118;
const STAGGER_MS = 40;
// Ícono oscuro fijo sobre el fondo verde sólido del botón central — no un
// token del theme, a propósito: debe contrastar contra ese verde sin
// importar si la app está en modo oscuro o claro (mismo criterio que el
// satélite "Crear" del menú de navegación, ver RadialMenu.tsx).
const CENTER_ICON_COLOR = '#04342C';

interface CreateFanMenuProps {
  onPickVideo: () => void;
  onPickImage: () => void;
  onPickAudio: () => void;
  onCreateText: () => void;
  onComposeChords: () => void;
}

interface SatelliteDef {
  key: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  x: number;
  y: number;
  backgroundColor: string;
  iconColor: string;
  onPress: () => void;
}

/**
 * Botón central de la pantalla "Crear": igual patrón de animación que
 * RadialMenu (motor compartido en FanOutSatellite), pero con su propio
 * botón central grande y 5 satélites distribuidos en pentágono (72° entre
 * cada uno, mismo radio que antes) en vez del arco de navegación.
 */
export function CreateFanMenu({
  onPickVideo,
  onPickImage,
  onPickAudio,
  onCreateText,
  onComposeChords,
}: CreateFanMenuProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isOpen, setIsOpen] = useState(false);
  const rotation = useSharedValue(0);

  const toggle = (): void => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    rotation.value = withTiming(nextOpen ? 1 : 0, { duration: 220 });
  };

  const close = (onPicked: () => void) => (): void => {
    setIsOpen(false);
    rotation.value = withTiming(0, { duration: 220 });
    onPicked();
  };

  // Pentágono regular (5 satélites, 72° entre cada uno) en vez de la cruz
  // de 4 direcciones cardinales de antes — al sumar "Componer acordes" se
  // redistribuyen los 5 para que queden parejos, no 4 fijos + 1 forzado.
  // "video" se mantiene arriba (mismo lugar que tenía), el resto sigue en
  // el mismo orden horario que antes.
  const satellites: SatelliteDef[] = [
    { key: 'video', icon: Video, x: 0, y: -RADIUS, backgroundColor: '#1B1F3D', iconColor: '#AFA9EC', onPress: close(onPickVideo) },
    { key: 'imagen', icon: ImageIcon, x: 112, y: -36, backgroundColor: '#3A1F16', iconColor: '#F0997B', onPress: close(onPickImage) },
    { key: 'acordes', icon: Piano, x: 69, y: 95, backgroundColor: '#0F2A4D', iconColor: '#3D7FFF', onPress: close(onComposeChords) },
    { key: 'audio', icon: Music, x: -69, y: 95, backgroundColor: '#3A1224', iconColor: '#ED93B1', onPress: close(onPickAudio) },
    { key: 'texto', icon: Pencil, x: -112, y: -36, backgroundColor: '#3A2A05', iconColor: '#EF9F27', onPress: close(onCreateText) },
  ];

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 45}deg` }],
  }));

  const helperAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - rotation.value,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.center}>
        {satellites.map((satellite, index) => (
          <FanOutSatellite
            key={satellite.key}
            satellite={toFanOutConfig(satellite)}
            index={index}
            totalCount={satellites.length}
            isOpen={isOpen}
            staggerMs={STAGGER_MS}
            onPress={satellite.onPress}
          />
        ))}

        <AnimatedPressable style={[styles.centerButton, centerAnimatedStyle]} onPress={toggle}>
          {isOpen ? (
            <X size={CENTER_ICON_SIZE} color={CENTER_ICON_COLOR} strokeWidth={2} />
          ) : (
            <Camera size={CENTER_ICON_SIZE} color={CENTER_ICON_COLOR} strokeWidth={2} />
          )}
        </AnimatedPressable>
      </View>

      <Animated.Text style={[styles.helperText, helperAnimatedStyle]} pointerEvents="none">
        Toca para elegir qué crear
      </Animated.Text>
    </View>
  );
}

function toFanOutConfig(satellite: SatelliteDef): FanOutSatelliteConfig {
  return {
    key: satellite.key,
    icon: satellite.icon,
    x: satellite.x,
    y: satellite.y,
    size: SATELLITE_SIZE,
    iconSize: SATELLITE_ICON_SIZE,
    backgroundColor: satellite.backgroundColor,
    iconColor: satellite.iconColor,
  };
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    center: {
      width: CENTER_SIZE,
      height: CENTER_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerButton: {
      width: CENTER_SIZE,
      height: CENTER_SIZE,
      borderRadius: CENTER_SIZE / 2,
      backgroundColor: theme.colors.accentSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helperText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
