import { useMemo } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useTheme, type Theme } from '../../src/theme/ThemeProvider';

export default function MessagePlaceholderScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { username } = useLocalSearchParams<{ username: string }>();

  // Sin imagen relevante todavía (placeholder) — fondo ambiental de
  // escritorio cae al color sólido del theme.
  useAmbientBackground(null);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Mensaje', headerBackTitle: 'Atrás' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Mensajes próximamente</Text>
        <Text style={styles.subtitle}>
          Todavía no puedes chatear con @{username} — la mensajería llega en su propio módulo.
        </Text>
      </View>
    </>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 8,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
