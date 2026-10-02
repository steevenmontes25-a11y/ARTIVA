import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Plus from 'lucide-react-native/icons/plus';

import { chordSymbol, romanNumeral } from '../../lib/music/theory';
import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';

/** Tira horizontal de la progresión actual — tocar un acorde lo selecciona, lo previsualiza, y lo resalta si está sonando. */
export function ChordStrip(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const chords = useChordComposerStore((s) => s.chords);
  const tonic = useChordComposerStore((s) => s.tonic);
  const mode = useChordComposerStore((s) => s.mode);
  const playing = useChordComposerStore((s) => s.playing);
  const currentIndex = useChordComposerStore((s) => s.currentIndex);
  const selectedIndex = useChordComposerStore((s) => s.selectedIndex);
  const progress = useChordComposerStore((s) => s.progress);
  const selectChord = useChordComposerStore((s) => s.selectChord);
  const previewIndex = useChordComposerStore((s) => s.previewIndex);
  const addChord = useChordComposerStore((s) => s.addChord);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Progresión</Text>
        <Text style={styles.hint}>Tocá un acorde para oírlo</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chords.map((slot, index) => {
          const active = playing && index === currentIndex;
          const selected = index === selectedIndex;
          const symbol = chordSymbol(tonic, mode, slot);
          const roman = romanNumeral(slot);

          return (
            <AnimatedPressable
              key={slot.id}
              style={[styles.chip, active ? styles.chipActive : selected && styles.chipSelected]}
              onPress={() => {
                selectChord(index);
                previewIndex(index);
              }}
            >
              <Text style={[styles.roman, active && styles.romanActive]}>{roman}</Text>
              <Text style={[styles.symbol, active && styles.symbolActive]}>{symbol}</Text>
              <View style={styles.beatsRow}>
                {Array.from({ length: slot.beats }).map((_, beatIndex) => (
                  <View key={beatIndex} style={[styles.beatDot, active && styles.beatDotActive]} />
                ))}
              </View>
              {active && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
              )}
            </AnimatedPressable>
          );
        })}

        <AnimatedPressable style={styles.addChip} onPress={addChord}>
          <Plus size={20} color={theme.colors.textSecondary} strokeWidth={2} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    label: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    hint: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    row: {
      gap: 8,
      paddingBottom: 4,
    },
    chip: {
      width: 108,
      minHeight: 128,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    chipSelected: {
      borderColor: colors.accentSecondary,
      borderWidth: 2,
    },
    chipActive: {
      backgroundColor: colors.accentSecondary,
      borderColor: colors.accentSecondary,
    },
    roman: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
    },
    romanActive: {
      // Fijo oscuro sobre el fondo verde sólido — ver nota de contraste en KeySelector.tsx.
      color: 'rgba(4,52,44,0.7)',
    },
    symbol: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    symbolActive: {
      color: '#04342C',
    },
    beatsRow: {
      flexDirection: 'row',
      gap: 3,
    },
    beatDot: {
      width: 12,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    beatDotActive: {
      backgroundColor: 'rgba(4,52,44,0.35)',
    },
    progressTrack: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
      backgroundColor: 'rgba(4,52,44,0.2)',
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'rgba(4,52,44,0.7)',
    },
    addChip: {
      width: 56,
      minHeight: 128,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
  });
}
