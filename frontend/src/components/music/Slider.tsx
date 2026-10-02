import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { useTheme, type Theme } from '../../theme/ThemeProvider';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;

/**
 * Slider simple con PanResponder (core de React Native, sin agregar
 * @react-native-community/slider ni ninguna otra dependencia nueva) — este
 * proyecto no tenía todavía un control de este tipo.
 *
 * Usa `measureInWindow` + `gestureState.moveX` (coordenadas absolutas de
 * pantalla) en vez de `locationX` del evento: `locationX` se vuelve poco
 * confiable en cuanto el dedo se arrastra fuera de los límites exactos del
 * track durante el drag (algo muy común al arrastrar rápido), mientras que
 * comparar contra la posición absoluta medida del track funciona sea cual
 * sea el recorrido del dedo.
 */
export function Slider({ value, min, max, step = 1, onChange }: SliderProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const measureTrack = (): void => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      trackWidthRef.current = width;
    });
  };

  const handleLayout = (event: LayoutChangeEvent): void => {
    setTrackWidth(event.nativeEvent.layout.width);
    measureTrack();
  };

  const valueFromPageX = (pageX: number): number => {
    const width = trackWidthRef.current;
    if (width <= 0) {
      return value;
    }
    const ratio = Math.max(0, Math.min(1, (pageX - trackPageXRef.current) / width));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_event, gestureState) => {
        measureTrack();
        onChange(valueFromPageX(gestureState.x0));
      },
      onPanResponderMove: (_event, gestureState) => {
        onChange(valueFromPageX(gestureState.moveX));
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ).current;

  const ratio = max === min ? 0 : (value - min) / (max - min);
  const thumbLeft = ratio * trackWidth;

  return (
    <View style={styles.hitArea} onLayout={handleLayout} {...panResponder.panHandlers}>
      <View ref={trackRef} style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: thumbLeft - THUMB_SIZE / 2 }]} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    hitArea: {
      height: 32,
      justifyContent: 'center',
    },
    track: {
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: theme.colors.accentSecondary,
    },
    thumb: {
      position: 'absolute',
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: theme.colors.accentSecondary,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
  });
}
