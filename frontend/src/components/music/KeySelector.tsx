import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { MODES, PC_NAMES_FLAT, PC_NAMES_SHARP, preferFlats, type ModeId } from '../../lib/music/theory';
import { AnimatedPressable } from '../AnimatedPressable';

/** Tonalidad (12 semitonos) y modo — necesarios para que los presets y la progresión sepan en qué tono sonar. */
export function KeySelector(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const tonic = useChordComposerStore((s) => s.tonic);
  const mode = useChordComposerStore((s) => s.mode);
  const setTonic = useChordComposerStore((s) => s.setTonic);
  const setMode = useChordComposerStore((s) => s.setMode);

  const names = preferFlats(tonic) ? PC_NAMES_FLAT : PC_NAMES_SHARP;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tonalidad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {names.map((name, pc) => (
          <Chip key={name} active={tonic === pc} label={name} onPress={() => setTonic(pc)} theme={theme} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Modo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {MODES.map((m) => (
          <Chip
            key={m.id}
            active={mode === m.id}
            label={m.name}
            onPress={() => setMode(m.id as ModeId)}
            theme={theme}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  active,
  label,
  onPress,
  theme,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  theme: Theme;
}): React.JSX.Element {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AnimatedPressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </AnimatedPressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    chipRow: {
      gap: 6,
      paddingBottom: 4,
    },
    chip: {
      minWidth: 40,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: colors.accentSecondary,
    },
    chipText: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
    },
    chipTextActive: {
      // Fijo oscuro (no onAccent/blanco): el verde de accentSecondary es
      // demasiado claro para texto blanco encima — mismo criterio que el
      // ícono del satélite "Crear" del menú circular (RadialMenu.tsx).
      color: '#04342C',
    },
  });
}
