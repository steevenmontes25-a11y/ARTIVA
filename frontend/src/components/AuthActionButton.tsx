import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { useTheme, type Theme } from '../theme/ThemeProvider';

interface AuthActionButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function AuthActionButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
}: AuthActionButtonProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || isLoading;

  return (
    <AnimatedPressable
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.onAccent} />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    button: {
      backgroundColor: colors.accentPrimary,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      minWidth: 160,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      ...typography.button,
      color: colors.onAccent,
    },
  });
}
