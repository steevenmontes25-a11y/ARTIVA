import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import Repeat from 'lucide-react-native/icons/repeat';
import Square from 'lucide-react-native/icons/square';
import Volume2 from 'lucide-react-native/icons/volume-2';

import { getPattern } from '../../lib/music/patterns';
import { chordSymbol, romanNumeral } from '../../lib/music/theory';
import { useChordComposerStore } from '../../store/chordComposerStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';
import { Slider } from './Slider';

/** Play/pause, tempo (BPM) y loop — accentSecondary para el estado "reproduciendo". */
export function Transport(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const playing = useChordComposerStore((s) => s.playing);
  const togglePlay = useChordComposerStore((s) => s.togglePlay);
  const stop = useChordComposerStore((s) => s.stop);
  const bpm = useChordComposerStore((s) => s.bpm);
  const setBpm = useChordComposerStore((s) => s.setBpm);
  const loop = useChordComposerStore((s) => s.loop);
  const setLoop = useChordComposerStore((s) => s.setLoop);
  const volume = useChordComposerStore((s) => s.volume);
  const setVolume = useChordComposerStore((s) => s.setVolume);
  const beatInBar = useChordComposerStore((s) => s.beatInBar);
  const patternId = useChordComposerStore((s) => s.patternId);
  const chords = useChordComposerStore((s) => s.chords);
  const currentIndex = useChordComposerStore((s) => s.currentIndex);
  const selectedIndex = useChordComposerStore((s) => s.selectedIndex);
  const tonic = useChordComposerStore((s) => s.tonic);
  const mode = useChordComposerStore((s) => s.mode);

  const pattern = getPattern(patternId);
  const focusIndex = playing ? currentIndex : (selectedIndex ?? currentIndex);
  const focus = chords[focusIndex];
  const symbol = focus ? chordSymbol(tonic, mode, focus) : '—';
  const roman = focus ? romanNumeral(focus) : '';

  return (
    <View style={styles.container}>
      <View style={styles.focusBlock}>
        <Text style={styles.roman}>{roman}</Text>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>

      <View style={styles.pulseRow}>
        {Array.from({ length: pattern.beatsPerBar }).map((_, i) => (
          <View key={i} style={[styles.pulseDot, playing && i === beatInBar && styles.pulseDotActive]} />
        ))}
      </View>

      <View style={styles.controlsRow}>
        <AnimatedPressable style={styles.stopButton} onPress={stop}>
          <Square size={16} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} strokeWidth={0} />
        </AnimatedPressable>

        <AnimatedPressable style={[styles.playButton, playing && styles.playButtonActive]} onPress={togglePlay}>
          {playing ? (
            <Pause size={18} color="#04342C" strokeWidth={2} />
          ) : (
            <Play size={18} color={theme.colors.onAccent} fill={theme.colors.onAccent} strokeWidth={0} />
          )}
          <Text style={[styles.playLabel, playing && styles.playLabelActive]}>
            {playing ? 'Pausa' : 'Reproducir'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable style={[styles.loopButton, loop && styles.loopButtonActive]} onPress={() => setLoop(!loop)}>
          <Repeat size={16} color={loop ? '#04342C' : theme.colors.textSecondary} strokeWidth={2} />
        </AnimatedPressable>
      </View>

      <View style={styles.volumeRow}>
        <Volume2 size={16} color={theme.colors.textSecondary} strokeWidth={2} />
        <View style={styles.volumeSlider}>
          <Slider min={0} max={1} step={0.01} value={volume} onChange={setVolume} />
        </View>
      </View>

      <View style={styles.tempoRow}>
        <Text style={styles.label}>Tempo</Text>
        <Text style={styles.bpmValue}>{bpm} BPM</Text>
      </View>
      <Slider min={48} max={180} step={1} value={bpm} onChange={setBpm} />
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: 12,
    },
    focusBlock: {
      alignItems: 'center',
    },
    roman: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    symbol: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    pulseRow: {
      flexDirection: 'row',
      gap: 8,
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    pulseDotActive: {
      backgroundColor: colors.accentSecondary,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stopButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minWidth: 148,
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 20,
      justifyContent: 'center',
      backgroundColor: colors.accentPrimary,
    },
    playButtonActive: {
      backgroundColor: colors.accentSecondary,
    },
    playLabel: {
      ...typography.bodyMedium,
      color: colors.onAccent,
    },
    playLabelActive: {
      color: '#04342C',
    },
    loopButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loopButtonActive: {
      backgroundColor: colors.accentSecondary,
      borderColor: colors.accentSecondary,
    },
    volumeRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 4,
    },
    volumeSlider: {
      flex: 1,
    },
    tempoRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 4,
    },
    label: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    bpmValue: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textPrimary,
    },
  });
}
