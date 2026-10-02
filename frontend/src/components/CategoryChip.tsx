import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { useTheme, type Theme } from '../theme/ThemeProvider';

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AnimatedPressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </AnimatedPressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    chipText: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.onAccent,
    },
  });
}
