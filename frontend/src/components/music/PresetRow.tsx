import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PRESETS } from '../../lib/music/progressions';
import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';

/** Progresiones preestablecidas (I–V–vi–IV, ii–V–I, blues de 12 compases, etc.) para empezar rápido. */
export function PresetRow(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const presetId = useChordComposerStore((s) => s.presetId);
  const loadPreset = useChordComposerStore((s) => s.loadPreset);

  return (
    <View>
      <Text style={styles.label}>Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRESETS.map((preset) => {
          const active = presetId === preset.id;
          return (
            <AnimatedPressable
              key={preset.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => loadPreset(preset.id)}
            >
              <Text style={[styles.name, active && styles.nameActive]}>{preset.name}</Text>
              <Text style={[styles.subtitle, active && styles.subtitleActive]}>{preset.subtitle}</Text>
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
      minWidth: 144,
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
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    subtitleActive: {
      color: 'rgba(4,52,44,0.7)',
    },
  });
}
