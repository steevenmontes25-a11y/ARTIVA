import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Copy from 'lucide-react-native/icons/copy';
import Play from 'lucide-react-native/icons/play';
import Trash2 from 'lucide-react-native/icons/trash-2';

import {
  DEGREE_CHIPS,
  QUALITIES,
  type BeatLength,
  type ChordSlot,
  type Inversion,
} from '../../lib/music/theory';
import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';

const BEATS: BeatLength[] = [1, 2, 3, 4];
const INVERSIONS: { id: Inversion; label: string }[] = [
  { id: 0, label: 'Fund.' },
  { id: 1, label: '1ª' },
  { id: 2, label: '2ª' },
  { id: 3, label: '3ª' },
];

/**
 * Editor completo del acorde seleccionado (el recién agregado, o el que se
 * tocó en la tira) — cada cambio se aplica al store al toque Y suena de
 * inmediato (feedback instantáneo), sin esperar a reproducir toda la
 * progresión. El botón de play del encabezado repite el acorde tal cual
 * está ahora, sin necesidad de tocar un chip.
 */
export function ChordEditor(): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const chords = useChordComposerStore((s) => s.chords);
  const selectedIndex = useChordComposerStore((s) => s.selectedIndex);
  const currentIndex = useChordComposerStore((s) => s.currentIndex);
  const playing = useChordComposerStore((s) => s.playing);
  const updateChord = useChordComposerStore((s) => s.updateChord);
  const setDegree = useChordComposerStore((s) => s.setDegree);
  const duplicateChord = useChordComposerStore((s) => s.duplicateChord);
  const removeChord = useChordComposerStore((s) => s.removeChord);
  const moveChord = useChordComposerStore((s) => s.moveChord);
  const previewIndex = useChordComposerStore((s) => s.previewIndex);

  const index = selectedIndex ?? (playing ? currentIndex : 0);
  const slot = chords[index];

  if (!slot) {
    return null;
  }

  const applyAndPreview = (patch: Partial<ChordSlot>): void => {
    updateChord(index, patch);
    previewIndex(index);
  };

  const applyDegreeAndPreview = (degree: ChordSlot['degree'], accidental: ChordSlot['accidental']): void => {
    setDegree(index, degree, accidental);
    previewIndex(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Editar acorde {index + 1}</Text>
        <View style={styles.headerActions}>
          <AnimatedPressable
            style={styles.iconButton}
            onPress={() => moveChord(index, -1)}
            disabled={index === 0}
          >
            <ChevronLeft size={16} color={index === 0 ? theme.colors.border : theme.colors.textSecondary} strokeWidth={2} />
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.iconButton}
            onPress={() => moveChord(index, 1)}
            disabled={index === chords.length - 1}
          >
            <ChevronRight
              size={16}
              color={index === chords.length - 1 ? theme.colors.border : theme.colors.textSecondary}
              strokeWidth={2}
            />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => previewIndex(index)}>
            <Play size={16} color={theme.colors.accentPrimary} fill={theme.colors.accentPrimary} strokeWidth={0} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => duplicateChord(index)}>
            <Copy size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => removeChord(index)}>
            <Trash2 size={16} color={theme.colors.error} strokeWidth={2} />
          </AnimatedPressable>
        </View>
      </View>

      <Field label="Grado">
        {DEGREE_CHIPS.map((d) => {
          const active = slot.degree === d.degree && slot.accidental === d.accidental;
          return (
            <Chip key={d.label} active={active} label={d.label} onPress={() => applyDegreeAndPreview(d.degree, d.accidental)} theme={theme} />
          );
        })}
      </Field>

      <Field label="Calidad">
        {QUALITIES.map((q) => (
          <Chip
            key={q.id}
            active={slot.quality === q.id}
            label={q.label}
            onPress={() => applyAndPreview({ quality: q.id })}
            theme={theme}
          />
        ))}
      </Field>

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <Field label="Inversión">
            {INVERSIONS.map((inv) => (
              <Chip
                key={inv.id}
                active={slot.inversion === inv.id}
                label={inv.label}
                onPress={() => applyAndPreview({ inversion: inv.id })}
                theme={theme}
              />
            ))}
          </Field>
        </View>
        <View style={styles.column}>
          <Field label="Duración">
            {BEATS.map((b) => (
              <Chip
                key={b}
                active={slot.beats === b}
                label={String(b)}
                onPress={() => applyAndPreview({ beats: b })}
                theme={theme}
              />
            ))}
          </Field>
        </View>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {children}
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
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    title: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 4,
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    chipRow: {
      gap: 6,
      paddingBottom: 2,
    },
    chip: {
      minWidth: 44,
      height: 36,
      paddingHorizontal: 10,
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
      color: '#04342C',
    },
    twoColumns: {
      flexDirection: 'row',
      gap: 16,
    },
    column: {
      flex: 1,
    },
  });
}
