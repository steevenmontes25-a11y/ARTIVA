import { playChord } from './player';
import type { PlayPattern, ToneSel } from './patterns';

/**
 * Transport de una progresión completa (play/pause/loop/bpm), portado del
 * `audio.ts` original — pero reemplazando su reproducción por Web Audio
 * (AudioContext/osciladores, que no existen en React Native) por llamadas a
 * playChord() de player.ts. Se reutiliza el ALGORITMO de posición temporal
 * (sp16/locate/currentSixteenth) tal cual, solo cambia qué hace cuando le
 * toca sonar un evento.
 *
 * Diferencia real frente al original: audio.ts usa el reloj de Web Audio
 * (ctx.currentTime) para pre-programar cada nota con precisión de muestra
 * hasta SCHEDULE_AHEAD segundos en el futuro — expo-audio no tiene un
 * equivalente ("reproducir esto en el instante X exacto"). Acá se sondea
 * con setInterval cada POLL_MS y se dispara apenas se cruza el 16to
 * correspondiente. A los BPM normales de esta herramienta (48–200) el
 * jitter de ese sondeo es imperceptible para componer/practicar, aunque no
 * es sample-accurate como un motor de audio profesional — dejarlo anotado
 * para no prometer algo que esto no es.
 */

export interface TimelineChord {
  notes: number[];
  beats: number;
}

export interface PlayConfig {
  bpm: number;
  loop: boolean;
  volume: number;
  pattern: PlayPattern;
  chords: TimelineChord[];
}

export interface PlayerSnapshot {
  playing: boolean;
  chordIndex: number;
  beatInBar: number;
  progress: number;
}

type Listener = (snapshot: PlayerSnapshot) => void;

const listeners = new Set<Listener>();

let live: PlayConfig | null = null;
let playing = false;
let lastChordIndex = 0;
let lastBeat = 0;
let startTimeMs = 0;
let startSixteenth = 0;
let firedUpTo = -1;
let timer: ReturnType<typeof setInterval> | null = null;

const POLL_MS = 25;

function emit(): void {
  const snap = snapshot();
  listeners.forEach((listener) => listener(snap));
}

export function subscribeTransport(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

function sp16(bpm: number): number {
  return 60 / Math.max(40, Math.min(220, bpm)) / 4;
}

function currentSixteenth(cfg: PlayConfig): number {
  const elapsedSeconds = (Date.now() - startTimeMs) / 1000;
  return startSixteenth + elapsedSeconds / sp16(cfg.bpm);
}

function locate(
  sixteenth: number,
  cfg: PlayConfig
): { chordIndex: number; offset: number; chordSixteenths: number; total: number } {
  const spans = cfg.chords.map((chord) => Math.max(1, chord.beats) * 4);
  const total = spans.reduce((a, b) => a + b, 0) || 1;
  const floor = Math.floor(Math.max(0, sixteenth));
  let pos = ((floor % total) + total) % total;
  const frac = Math.max(0, sixteenth) - floor;

  for (let i = 0; i < spans.length; i++) {
    if (pos < spans[i]) {
      return { chordIndex: i, offset: pos + frac, chordSixteenths: spans[i], total };
    }
    pos -= spans[i];
  }

  return { chordIndex: 0, offset: 0, chordSixteenths: spans[0] ?? 1, total };
}

export function snapshot(): PlayerSnapshot {
  const cfg = live;
  if (!cfg || cfg.chords.length === 0) {
    return { playing, chordIndex: 0, beatInBar: 0, progress: 0 };
  }

  const sixteenth = playing ? currentSixteenth(cfg) : 0;
  const { chordIndex, offset, chordSixteenths, total } = locate(sixteenth, cfg);

  if (!cfg.loop && sixteenth >= total) {
    return { playing: false, chordIndex: cfg.chords.length - 1, beatInBar: 0, progress: 1 };
  }

  const beatInBar = Math.floor(offset / 4) % cfg.pattern.beatsPerBar;
  const progress = chordSixteenths === 0 ? 0 : offset / chordSixteenths;

  return { playing, chordIndex, beatInBar, progress };
}

/** Actualiza la config en caliente (tempo/loop/volumen/patrón/acordes) sin cortar la reproducción. */
export function setLiveConfig(config: PlayConfig): void {
  if (playing && live) {
    const current = currentSixteenth(live);
    startSixteenth = current;
    startTimeMs = Date.now();
    firedUpTo = Math.floor(current) - 1;
  }
  live = config;
}

export function startTransport(config: PlayConfig): void {
  live = config;

  if (playing) {
    emit();
    return;
  }

  playing = true;
  startTimeMs = Date.now();
  startSixteenth = 0;
  firedUpTo = -1;
  lastChordIndex = 0;
  lastBeat = 0;
  emit();

  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(tick, POLL_MS);
  tick();
}

export function stopTransport(): void {
  playing = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  startSixteenth = 0;
  firedUpTo = -1;
  lastChordIndex = 0;
  lastBeat = 0;
  emit();
}

export function isTransportPlaying(): boolean {
  return playing;
}

/** Escucha rápida de un acorde suelto (edición/selección), sin arrancar el transport. */
export function previewChord(notes: number[], volume = 0.85): void {
  void playChord(notes, volume);
}

function tick(): void {
  if (!playing || !live) {
    return;
  }

  const cfg = live;
  if (cfg.chords.length === 0) {
    stopTransport();
    return;
  }

  const sixteenth = currentSixteenth(cfg);
  const { chordIndex, offset, total } = locate(sixteenth, cfg);
  const beatInBar = Math.floor(offset / 4) % cfg.pattern.beatsPerBar;

  if (!cfg.loop && sixteenth >= total) {
    stopTransport();
    return;
  }

  if (chordIndex !== lastChordIndex || beatInBar !== lastBeat) {
    lastChordIndex = chordIndex;
    lastBeat = beatInBar;
  }
  emit();

  const target = Math.floor(sixteenth);
  while (firedUpTo < target) {
    firedUpTo += 1;
    fireEventsAt(cfg, firedUpTo);
  }
}

function fireEventsAt(cfg: PlayConfig, sixteenth: number): void {
  const { chordIndex, offset } = locate(sixteenth, cfg);
  const chord = cfg.chords[chordIndex];
  if (!chord) {
    return;
  }

  const bar = cfg.pattern.beatsPerBar * 4;
  const atInBar = Math.floor(offset) % bar;

  for (const event of cfg.pattern.events) {
    if (event.at !== atInBar) {
      continue;
    }

    const notes = selectTones(chord.notes, event.tones);
    if (notes.length === 0) {
      continue;
    }

    void playChord(notes, event.vel * cfg.volume);
  }
}

function selectTones(notes: number[], selection: ToneSel): number[] {
  if (selection === 'all') {
    return notes;
  }

  return selection
    .map((i) => notes[((i % notes.length) + notes.length) % notes.length])
    .filter((note, index, all) => all.indexOf(note) === index);
}
