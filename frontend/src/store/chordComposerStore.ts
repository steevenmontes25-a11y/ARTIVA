import { create } from 'zustand';

import { secureStorage } from '../api/secureStorage';
import { getPattern } from '../lib/music/patterns';
import { presetSlots, PRESETS } from '../lib/music/progressions';
import { diatonicQuality, makeSlot, slotNotes, type Accidental, type ChordSlot, type ModeId } from '../lib/music/theory';
import {
  previewChord,
  setLiveConfig,
  startTransport,
  stopTransport,
  subscribeTransport,
  type PlayConfig,
} from '../lib/music/transport';

// Igual store que el original (src/lib/store.ts del prototipo web), con
// persistencia vía secureStorage (ya usado en el proyecto para el token de
// auth, ver src/api/secureStorage.ts) en vez de `localStorage` directo — en
// web cae a localStorage igual, en nativo usa SecureStore.
const STORAGE_KEY = 'artiva_chord_composer_v1';

interface PersistedState {
  tonic: number;
  mode: ModeId;
  bpm: number;
  loop: boolean;
  volume: number;
  patternId: string;
  chords: ChordSlot[];
  presetId: string | null;
  selectedIndex: number | null;
}

export interface ChordComposerState {
  tonic: number;
  mode: ModeId;
  bpm: number;
  loop: boolean;
  volume: number;
  patternId: string;
  chords: ChordSlot[];
  presetId: string | null;
  selectedIndex: number | null;
  playing: boolean;
  currentIndex: number;
  beatInBar: number;
  progress: number;
  hydrated: boolean;
}

interface ChordComposerActions {
  hydrate: () => Promise<void>;
  setTonic: (tonic: number) => void;
  setMode: (mode: ModeId) => void;
  setBpm: (bpm: number) => void;
  setLoop: (loop: boolean) => void;
  setVolume: (volume: number) => void;
  setPattern: (patternId: string) => void;
  loadPreset: (id: string) => void;
  selectChord: (index: number) => void;
  updateChord: (index: number, patch: Partial<ChordSlot>) => void;
  setDegree: (index: number, degree: ChordSlot['degree'], accidental: Accidental) => void;
  addChord: () => void;
  duplicateChord: (index: number) => void;
  removeChord: (index: number) => void;
  moveChord: (index: number, direction: -1 | 1) => void;
  play: () => void;
  stop: () => void;
  togglePlay: () => void;
  previewIndex: (index: number) => void;
}

type Store = ChordComposerState & ChordComposerActions;

const defaultPreset = PRESETS[0];

const initialState: ChordComposerState = {
  tonic: 0,
  mode: defaultPreset.mode,
  bpm: 96,
  loop: true,
  volume: 0.85,
  patternId: 'block',
  chords: presetSlots(defaultPreset),
  presetId: defaultPreset.id,
  selectedIndex: 0,
  playing: false,
  currentIndex: 0,
  beatInBar: 0,
  progress: 0,
  hydrated: false,
};

function persist(state: ChordComposerState): void {
  if (!state.hydrated) {
    return;
  }

  const data: PersistedState = {
    tonic: state.tonic,
    mode: state.mode,
    bpm: state.bpm,
    loop: state.loop,
    volume: state.volume,
    patternId: state.patternId,
    chords: state.chords,
    presetId: state.presetId,
    selectedIndex: state.selectedIndex,
  };

  // Best-effort: si falla (cuota, storage no disponible), la sesión sigue
  // funcionando en memoria, solo no persiste entre reinicios de la app.
  secureStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

function toConfig(state: ChordComposerState): PlayConfig {
  return {
    bpm: state.bpm,
    loop: state.loop,
    volume: state.volume,
    pattern: getPattern(state.patternId),
    chords: state.chords.map((chord) => ({
      notes: slotNotes(state.tonic, state.mode, chord),
      beats: chord.beats,
    })),
  };
}

function syncLive(state: ChordComposerState): void {
  if (state.playing) {
    setLiveConfig(toConfig(state));
  }
  persist(state);
}

export const useChordComposerStore = create<Store>((set, get) => ({
  ...initialState,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      const raw = await secureStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<PersistedState>;
        set({
          tonic: typeof data.tonic === 'number' ? data.tonic : initialState.tonic,
          mode: data.mode ?? initialState.mode,
          bpm: typeof data.bpm === 'number' ? data.bpm : initialState.bpm,
          loop: data.loop ?? initialState.loop,
          volume: typeof data.volume === 'number' ? data.volume : initialState.volume,
          patternId: data.patternId ?? initialState.patternId,
          chords: Array.isArray(data.chords) && data.chords.length > 0 ? data.chords : initialState.chords,
          presetId: data.presetId ?? null,
          selectedIndex: data.selectedIndex ?? 0,
          hydrated: true,
        });
        return;
      }
    } catch {
      // Se queda con los defaults si el storage falla o el JSON es inválido.
    }

    set({ hydrated: true });
  },

  setTonic: (tonic) => {
    set((state) => {
      const next = { ...state, tonic };
      syncLive(next);
      return { tonic };
    });
  },

  setMode: (mode) => {
    set((state) => {
      syncLive({ ...state, mode });
      return { mode };
    });
  },

  setBpm: (bpm) => {
    const clamped = Math.max(48, Math.min(180, Math.round(bpm)));
    set((state) => {
      syncLive({ ...state, bpm: clamped });
      return { bpm: clamped };
    });
  },

  setLoop: (loop) => {
    set((state) => {
      syncLive({ ...state, loop });
      return { loop };
    });
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set((state) => {
      syncLive({ ...state, volume: clamped });
      return { volume: clamped };
    });
  },

  setPattern: (patternId) => {
    set((state) => {
      syncLive({ ...state, patternId });
      return { patternId };
    });
  },

  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) {
      return;
    }

    set((state) => {
      const next: ChordComposerState = {
        ...state,
        mode: preset.mode,
        chords: presetSlots(preset),
        presetId: preset.id,
        selectedIndex: 0,
        currentIndex: 0,
        progress: 0,
      };
      syncLive(next);
      return {
        mode: next.mode,
        chords: next.chords,
        presetId: next.presetId,
        selectedIndex: 0,
        currentIndex: 0,
        progress: 0,
      };
    });
  },

  selectChord: (index) => set({ selectedIndex: index }),

  updateChord: (index, patch) => {
    set((state) => {
      const chords = state.chords.map((chord, i) => (i === index ? { ...chord, ...patch } : chord));
      const next = { ...state, chords, presetId: null };
      syncLive(next);
      return { chords, presetId: null };
    });
  },

  setDegree: (index, degree, accidental) => {
    set((state) => {
      const chords = state.chords.map((chord, i) =>
        i === index
          ? {
              ...chord,
              degree,
              accidental,
              // Grado diatónico (sin alteración): calidad "natural" de la
              // escala en ese grado. Con alteración (♭/♯) no hay una
              // calidad diatónica que aplique — arranca en "maj" y el
              // usuario la ajusta a mano en el chip de Calidad si hace falta.
              quality: accidental === 0 ? diatonicQuality(state.mode, degree) : 'maj',
            }
          : chord
      );
      const next = { ...state, chords, presetId: null };
      syncLive(next);
      return { chords, presetId: null };
    });
  },

  // Acorde nuevo por defecto (I del modo actual, 4 tiempos) al final de la
  // progresión — no una copia del último, para que "agregar" siempre dé un
  // punto de partida neutro que el editor deja listo para modificar. Queda
  // seleccionado automáticamente para que el editor se abra sobre él.
  addChord: () => {
    set((state) => {
      const inserted = makeSlot({
        degree: 1,
        accidental: 0,
        quality: diatonicQuality(state.mode, 1),
        inversion: 0,
        beats: 4,
      });

      const chords = [...state.chords, inserted];
      const selectedIndex = chords.length - 1;
      const next = { ...state, chords, selectedIndex, presetId: null };
      syncLive(next);
      return { chords, selectedIndex, presetId: null };
    });
  },

  duplicateChord: (index) => {
    set((state) => {
      const source = state.chords[index];
      if (!source) {
        return {};
      }

      const copy = makeSlot({
        degree: source.degree,
        accidental: source.accidental,
        quality: source.quality,
        inversion: source.inversion,
        beats: source.beats,
      });

      const chords = [...state.chords];
      chords.splice(index + 1, 0, copy);
      const next = { ...state, chords, selectedIndex: index + 1, presetId: null };
      syncLive(next);
      return { chords, selectedIndex: index + 1, presetId: null };
    });
  },

  removeChord: (index) => {
    set((state) => {
      if (state.chords.length <= 1) {
        const chords = [
          makeSlot({ degree: 1, accidental: 0, quality: diatonicQuality(state.mode, 1), inversion: 0, beats: 4 }),
        ];
        const next = { ...state, chords, selectedIndex: 0, presetId: null };
        syncLive(next);
        return { chords, selectedIndex: 0, presetId: null };
      }

      const chords = state.chords.filter((_, i) => i !== index);
      const selectedIndex = Math.min(index, chords.length - 1);
      const next = { ...state, chords, selectedIndex, presetId: null };
      syncLive(next);
      return { chords, selectedIndex, presetId: null };
    });
  },

  moveChord: (index, direction) => {
    set((state) => {
      const target = index + direction;
      if (target < 0 || target >= state.chords.length) {
        return {};
      }

      const chords = [...state.chords];
      const [item] = chords.splice(index, 1);
      chords.splice(target, 0, item);
      const next = { ...state, chords, selectedIndex: target, presetId: null };
      syncLive(next);
      return { chords, selectedIndex: target, presetId: null };
    });
  },

  play: () => {
    const state = get();
    if (state.chords.length === 0) {
      return;
    }
    startTransport(toConfig(state));
    set({ playing: true });
  },

  stop: () => {
    stopTransport();
    set({ playing: false, currentIndex: 0, beatInBar: 0, progress: 0 });
  },

  togglePlay: () => {
    const state = get();
    if (state.playing) {
      state.stop();
    } else {
      state.play();
    }
  },

  previewIndex: (index) => {
    const state = get();
    const chord = state.chords[index];
    if (!chord || state.playing) {
      return;
    }
    previewChord(slotNotes(state.tonic, state.mode, chord), state.volume);
  },
}));

let unsubscribeTransport: (() => void) | null = null;

/** Sincroniza el store con los eventos del transport (posición/beat en vivo). Llamar una vez al montar la pantalla. */
export function bindChordComposerTransport(): () => void {
  if (unsubscribeTransport) {
    return unsubscribeTransport;
  }

  unsubscribeTransport = subscribeTransport((snap) => {
    const state = useChordComposerStore.getState();
    if (state.playing !== snap.playing || state.currentIndex !== snap.chordIndex || state.beatInBar !== snap.beatInBar) {
      useChordComposerStore.setState({
        playing: snap.playing,
        currentIndex: snap.chordIndex,
        beatInBar: snap.beatInBar,
        progress: snap.progress,
      });
    } else if (Math.abs(state.progress - snap.progress) > 0.02) {
      useChordComposerStore.setState({ progress: snap.progress });
    }
  });

  return unsubscribeTransport;
}
