import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';

const SHIMMER_DURATION_MS = 1100;
const SHIMMER_WIDTH_RATIO = 0.5;

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bloque de skeleton con shimmer: una franja clara se desliza de izquierda a
 * derecha en loop sobre un fondo `surfaceElevated`, corriendo en el hilo
 * nativo (Reanimated). Se usa en vez de un ActivityIndicator para las cargas
 * iniciales del feed y la grilla de perfil — se percibe más rápido/pulido.
 */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonBlockProps): React.JSX.Element {
  const { colors } = useTheme();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value * (1 + SHIMMER_WIDTH_RATIO) - SHIMMER_WIDTH_RATIO) * measuredWidth }],
  }));

  const handleLayout = (event: LayoutChangeEvent): void => {
    setMeasuredWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        { width, height, borderRadius, backgroundColor: colors.surfaceElevated, overflow: 'hidden' },
        style,
      ]}
    >
      {measuredWidth > 0 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { width: measuredWidth * SHIMMER_WIDTH_RATIO, backgroundColor: colors.border, opacity: 0.6 },
            shimmerStyle,
          ]}
        />
      )}
    </View>
  );
}
