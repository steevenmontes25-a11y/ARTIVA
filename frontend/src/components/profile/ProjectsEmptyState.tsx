import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '../../theme/ThemeProvider';

/**
 * El dominio Projects todavía no existe en el backend (sin modelo/tabla
 * propia — ver GetArtistProfileAction, `projects` count queda en 0 real).
 * En vez de simular filas de proyectos con datos falsos, este tab muestra
 * un estado vacío honesto hasta que ese módulo se construya.
 */
export function ProjectsEmptyState(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sin proyectos todavía</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    text: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
  });
}
