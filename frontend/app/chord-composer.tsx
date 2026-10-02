import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { ChordEditor } from '../src/components/music/ChordEditor';
import { ChordStrip } from '../src/components/music/ChordStrip';
import { KeySelector } from '../src/components/music/KeySelector';
import { PatternRow } from '../src/components/music/PatternRow';
import { PresetRow } from '../src/components/music/PresetRow';
import { Transport } from '../src/components/music/Transport';
import { VoicingKeyboard } from '../src/components/music/VoicingKeyboard';
import { useAmbientBackground } from '../src/hooks/useAmbientBackground';
import { preloadNoteSamples, releaseNoteSamples } from '../src/lib/music/player';
import { bindChordComposerTransport, useChordComposerStore } from '../src/store/chordComposerStore';
import { useTheme, type Theme } from '../src/theme/ThemeProvider';

/**
 * "Cadenza" — herramienta standalone de composición de acordes (categoría
 * Producción musical). No publica nada al feed todavía: es un espacio de
 * práctica/composición, ver Parte 4 del pedido original. Entrada desde el
 * abanico de la pantalla Crear (CreateFanMenu).
 */
export default function ChordComposerScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Sin imagen relevante (herramienta) — fondo ambiental de escritorio cae
  // al color sólido del theme.
  useAmbientBackground(null);

  const hydrate = useChordComposerStore((s) => s.hydrate);
  const stop = useChordComposerStore((s) => s.stop);

  useEffect(() => {
    preloadNoteSamples();
    hydrate();
    bindChordComposerTransport();

    return () => {
      stop();
      releaseNoteSamples();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Cadenza', headerBackTitle: 'Atrás' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <KeySelector />

        <View style={styles.section}>
          <ChordStrip />
        </View>

        <View style={styles.section}>
          <ChordEditor />
        </View>

        <View style={styles.section}>
          <Transport />
        </View>

        <View style={styles.section}>
          <PresetRow />
        </View>

        <View style={styles.section}>
          <PatternRow />
        </View>

        <View style={styles.section}>
          <VoicingKeyboard />
        </View>
      </ScrollView>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 20,
    },
    section: {
      gap: 8,
    },
  });
}
