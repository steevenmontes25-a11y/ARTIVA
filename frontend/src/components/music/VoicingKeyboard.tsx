import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playNote } from '../../lib/music/player';
import { midiName, preferFlats, slotNotes } from '../../lib/music/theory';
import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';

const START_MIDI = 48; // C3
const END_MIDI = 72; // C5 — dos octavas completas de punta a punta
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

/**
 * Teclado de piano tocable: cada tecla suena al tocarla (playNote directo,
 * independiente del transport de la progresión) y las notas del acorde
 * actual (seleccionado, o el que está sonando si hay reproducción activa)
 * quedan resaltadas en accentPrimary.
 */
export function VoicingKeyboard(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const chords = useChordComposerStore((s) => s.chords);
  const selectedIndex = useChordComposerStore((s) => s.selectedIndex);
  const currentIndex = useChordComposerStore((s) => s.currentIndex);
  const playing = useChordComposerStore((s) => s.playing);
  const tonic = useChordComposerStore((s) => s.tonic);
  const mode = useChordComposerStore((s) => s.mode);

  const index = playing ? currentIndex : (selectedIndex ?? currentIndex);
  const slot = chords[index];
  const flats = preferFlats(tonic);

  const activeNotes = useMemo(() => new Set(slot ? slotNotes(tonic, mode, slot) : []), [slot, tonic, mode]);

  const whiteMidiNotes = useMemo(() => {
    const whites: number[] = [];
    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      if (!BLACK_PITCH_CLASSES.has(midi % 12)) {
        whites.push(midi);
      }
    }
    return whites;
  }, []);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Teclado</Text>
        {slot && (
          <Text style={styles.notesLabel} numberOfLines={1}>
            {slotNotes(tonic, mode, slot)
              .map((n) => midiName(n, flats))
              .join('  ')}
          </Text>
        )}
      </View>

      <View style={styles.keyboard}>
        {whiteMidiNotes.map((midi) => {
          const blackMidi = midi + 1;
          const showBlack = BLACK_PITCH_CLASSES.has(blackMidi % 12) && blackMidi <= END_MIDI;

          return (
            <View key={midi} style={styles.whiteKeySlot}>
              <Pressable
                style={[styles.whiteKey, activeNotes.has(midi) && styles.keyActive]}
                onPress={() => void playNote(midi)}
              />
              {showBlack && (
                <Pressable
                  style={[styles.blackKey, activeNotes.has(blackMidi) && styles.blackKeyActive]}
                  onPress={() => void playNote(blackMidi)}
                />
              )}
            </View>
          );
        })}
      </View>
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
    notesLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      flexShrink: 1,
      textAlign: 'right',
    },
    keyboard: {
      flexDirection: 'row',
      height: 110,
      borderRadius: 14,
      backgroundColor: colors.surfaceElevated,
      padding: 4,
      overflow: 'hidden',
    },
    whiteKeySlot: {
      flex: 1,
      minWidth: 0,
      position: 'relative',
    },
    whiteKey: {
      flex: 1,
      borderRadius: 4,
      marginHorizontal: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blackKey: {
      position: 'absolute',
      top: 0,
      // Centrada sobre el borde entre esta tecla blanca y la siguiente:
      // ancho 55%, la mitad (27.5%) "cuelga" fuera del slot hacia la
      // derecha. Porcentaje de layout normal (Yoga), no un transform — los
      // porcentajes en `transform` tienen soporte más inconsistente entre
      // plataformas (ver el bug de altura animada por Reanimated ya
      // encontrado en este proyecto), mientras que left/right/width en % es
      // el layout estándar de RN, sin ese riesgo.
      right: '-27.5%',
      height: '58%',
      width: '55%',
      borderRadius: 3,
      backgroundColor: colors.textPrimary,
      zIndex: 2,
    },
    keyActive: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    blackKeyActive: {
      backgroundColor: colors.accentPrimary,
    },
  });
}
