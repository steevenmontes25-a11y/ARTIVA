import { useEffect, type ComponentType } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { AnimatedPressable } from './AnimatedPressable';

interface FanOutIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export interface FanOutSatelliteConfig {
  key: string;
  icon: ComponentType<FanOutIconProps>;
  x: number;
  y: number;
  size: number;
  iconSize: number;
  backgroundColor: string;
  iconColor: string;
  borderColor?: string;
}

interface FanOutSatelliteProps {
  satellite: FanOutSatelliteConfig;
  index: number;
  totalCount: number;
  isOpen: boolean;
  staggerMs: number;
  onPress: () => void;
}

/**
 * Motor genérico de un satélite de menú "en abanico": aparece con stagger +
 * spring bounce al abrirse, en reversa (más lejano entra último, sale
 * primero) al cerrarse. Compartido por RadialMenu (navegación) y
 * CreateFanMenu (pantalla Crear) — no duplicar esta lógica en cada uno.
 *
 * La animación se dispara desde un useEffect, NO dentro de useAnimatedStyle:
 * llamar withSpring/withDelay directo en el worklet de useAnimatedStyle
 * reinicia la animación en cada evaluación (anti-patrón de Reanimated ya
 * identificado en este proyecto).
 */
export function FanOutSatellite({
  satellite,
  index,
  totalCount,
  isOpen,
  staggerMs,
  onPress,
}: FanOutSatelliteProps): React.JSX.Element {
  const Icon = satellite.icon;
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = isOpen ? index * staggerMs : (totalCount - 1 - index) * staggerMs;
    progress.value = withDelay(delay, withSpring(isOpen ? 1 : 0, { damping: 12, stiffness: 180 }));
  }, [isOpen, index, totalCount, staggerMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: progress.value * satellite.x },
      { translateY: progress.value * satellite.y },
      { scale: progress.value },
    ],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
      <AnimatedPressable
        style={[
          styles.satellite,
          {
            width: satellite.size,
            height: satellite.size,
            borderRadius: satellite.size / 2,
            backgroundColor: satellite.backgroundColor,
            borderColor: satellite.borderColor,
            borderWidth: satellite.borderColor ? 2 : 0,
          },
        ]}
        onPress={onPress}
      >
        <Icon size={satellite.iconSize} color={satellite.iconColor} strokeWidth={2} />
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  satellite: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
