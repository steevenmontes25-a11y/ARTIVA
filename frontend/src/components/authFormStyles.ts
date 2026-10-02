import { StyleSheet } from 'react-native';

import type { Theme } from '../theme/ThemeProvider';

export function createAuthFormStyles(theme: Theme) {
  const { colors, typography } = theme;

  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      gap: 12,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      ...typography.body,
    },
    error: {
      ...typography.bodySmall,
      color: colors.error,
    },
    link: {
      ...typography.bodyMedium,
      color: colors.accentPrimary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return { ...styles, placeholderColor: colors.textSecondary };
}
