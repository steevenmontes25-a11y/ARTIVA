import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const PRESS_SCALE = 0.95;
const PRESS_ANIMATION_MS = 100;

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  // Mismo tipo de `style` que ya acepta el Pressable animado (estilos planos
  // Y estilos de useAnimatedStyle mezclados en el mismo array) — así callers
  // como el morph de color de ProfileActionButtons pueden combinar su propio
  // useAnimatedStyle con el press-scale que este componente agrega.
  style?: ComponentProps<typeof ReanimatedPressable>['style'];
}

/**
 * Pressable con la misma API que el de React Native, más una micro-animación
 * de "press": escala a 0.95 al tocar y vuelve a 1 al soltar/cancelar. Corre
 * enteramente en el hilo nativo (Reanimated), así que no compite con el JS
 * thread ni afecta el scroll de listas (FlatList del feed, grillas, etc).
 *
 * Reemplazo directo de <Pressable> para cualquier botón/ícono táctil
 * "importante" de la UI (like, save, follow, enviar, CTAs) — no pensado para
 * superficies grandes de contenido (ej. el área de doble-tap del feed).
 */
export function AnimatedPressable({
  children,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...pressableProps
}: AnimatedPressableProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent): void => {
    scale.value = withTiming(PRESS_SCALE, { duration: PRESS_ANIMATION_MS });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent): void => {
    scale.value = withTiming(1, { duration: PRESS_ANIMATION_MS });
    onPressOut?.(event);
  };

  return (
    <ReanimatedPressable
      style={[style, animatedStyle]}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...pressableProps}
    >
      {children}
    </ReanimatedPressable>
  );
}
