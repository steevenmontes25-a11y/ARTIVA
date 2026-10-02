import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PATTERNS } from '../../lib/music/patterns';
import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';

/** Patrón rítmico (bloque, arpegio, rasgueo, etc.) — cambia cómo se pulsa la progresión al reproducirla. */
export function PatternRow(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const patternId = useChordComposerStore((s) => s.patternId);
  const setPattern = useChordComposerStore((s) => s.setPattern);

  return (
    <View>
      <Text style={styles.label}>Patrón</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PATTERNS.map((pattern) => {
          const active = patternId === pattern.id;
          return (
            <AnimatedPressable
              key={pattern.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setPattern(pattern.id)}
            >
              <Text style={[styles.name, active && styles.nameActive]}>{pattern.name}</Text>
              <Text style={[styles.hint, active && styles.hintActive]} numberOfLines={1}>
                {pattern.hint}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    label: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    row: {
      gap: 8,
      paddingBottom: 4,
    },
    chip: {
      minWidth: 128,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      gap: 2,
    },
    chipActive: {
      backgroundColor: colors.accentSecondary,
    },
    name: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textPrimary,
    },
    nameActive: {
      color: '#04342C',
    },
    hint: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    hintActive: {
      color: 'rgba(4,52,44,0.7)',
    },
  });
}
