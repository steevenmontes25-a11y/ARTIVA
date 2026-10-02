import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { NOTE_SAMPLE_MAX_MIDI, NOTE_SAMPLE_MIN_MIDI, noteSampleAssets } from './noteSamples';

/**
 * Reproductor de notas/acordes para la herramienta de composición, sobre
 * expo-audio (NO Web Audio API / AudioContext — eso no existe en React
 * Native, ver la nota de la Parte 2 del pedido). Un `AudioPlayer` real por
 * nota MIDI, precargado una sola vez y reutilizado en cada disparo
 * (seekTo(0) + play()) — evita la latencia de crear/cargar un asset nuevo
 * en cada tecla presionada, que sí sería perceptible.
 *
 * Cubre la reproducción de notas/acordes en sí (con volumen por disparo,
 * para los patrones rítmicos de patterns.ts que varían `vel` por evento).
 * El transport de una progresión completa (play/pause/loop/bpm) vive en
 * transport.ts, que llama a playChord() en cada paso en vez de al
 * AudioContext original de audio.ts.
 */

interface PooledNote {
  player: AudioPlayer;
  /** MIDI de la muestra real cargada en este player (puede diferir de la nota pedida si cayó fuera del rango grabado). */
  sampleMidi: number;
}

const notePool = new Map<number, PooledNote>();

function clampToSampleRange(midi: number): number {
  return Math.min(NOTE_SAMPLE_MAX_MIDI, Math.max(NOTE_SAMPLE_MIN_MIDI, midi));
}

function createPooledNote(midi: number): PooledNote {
  const sampleMidi = clampToSampleRange(midi);
  const player = createAudioPlayer(noteSampleAssets[sampleMidi]);

  // Si la nota pedida cae fuera de las 2 octavas grabadas, se reafina por
  // playbackRate en vez de generar más muestras — shouldCorrectPitch=false
  // para que el cambio de velocidad SÍ cambie el tono (por defecto muchos
  // reproductores "corrigen" el tono al cambiar la velocidad, que es
  // justo lo contrario de lo que queremos acá).
  if (sampleMidi !== midi) {
    player.shouldCorrectPitch = false;
    player.playbackRate = Math.pow(2, (midi - sampleMidi) / 12);
  }

  return { player, sampleMidi };
}

function getOrCreatePooledNote(midi: number): PooledNote {
  const existing = notePool.get(midi);
  if (existing) {
    return existing;
  }

  const pooled = createPooledNote(midi);
  notePool.set(midi, pooled);
  return pooled;
}

/**
 * Precarga las 24 notas grabadas (sin pitch-shift) para que la primera
 * tecla que el usuario toque no tenga que esperar a que un AudioPlayer
 * nuevo cargue su asset. Llamar al montar la pantalla de la herramienta
 * (nunca a nivel de módulo/import: esta función solo debe ejecutar cuando
 * la pantalla de Cadenza realmente se monta, para que una falla acá afecte
 * solo a quien entra a esa pantalla, no al arranque de toda la app).
 *
 * Cada nota se crea en su propio try/catch: si UN sample falla (archivo
 * corrupto, códec no soportado en algún dispositivo, etc.) las demás 23
 * igual quedan precargadas en vez de que la función entera aborte.
 */
export function preloadNoteSamples(): void {
  for (let midi = NOTE_SAMPLE_MIN_MIDI; midi <= NOTE_SAMPLE_MAX_MIDI; midi++) {
    try {
      getOrCreatePooledNote(midi);
    } catch (error) {
      console.warn(`[chord-composer] No se pudo precargar la nota MIDI ${midi}:`, error);
    }
  }
}

/**
 * Reproduce un acorde: todas las notas MIDI dadas suenan a la vez. Cada
 * nota es un AudioPlayer independiente (uno por semitono, del pool
 * precargado) — expo-audio mezcla la reproducción simultánea de varios
 * players sin configuración adicional (ver AudioMode.interruptionMode,
 * 'mixWithOthers' por defecto).
 */
export async function playChord(midiNotes: number[], velocity = 1): Promise<void> {
  if (midiNotes.length === 0) {
    return;
  }

  const clampedVolume = Math.max(0, Math.min(1, velocity));

  // Una nota que falla al crear/cargar su player no debe silenciar el resto
  // del acorde — se filtra acá y las demás igual suenan.
  const pooledNotes: PooledNote[] = [];
  for (const midi of midiNotes) {
    try {
      pooledNotes.push(getOrCreatePooledNote(midi));
    } catch (error) {
      console.warn(`[chord-composer] No se pudo reproducir la nota MIDI ${midi}:`, error);
    }
  }

  // Se resetean todas las posiciones EN PARALELO (no una por una) antes de
  // reproducir — así las notas del acorde arrancan juntas en vez de con un
  // "strum" involuntario por esperas secuenciales.
  await Promise.all(
    pooledNotes.map(({ player }) =>
      player.seekTo(0).catch((error: unknown) => {
        console.warn('[chord-composer] No se pudo reposicionar una nota:', error);
      })
    )
  );

  for (const { player } of pooledNotes) {
    try {
      player.volume = clampedVolume;
      player.play();
    } catch (error) {
      console.warn('[chord-composer] No se pudo reproducir una nota:', error);
    }
  }
}

/** Reproduce una única nota — atajo de playChord([midi]) para el teclado visual. */
export function playNote(midi: number, velocity = 1): Promise<void> {
  return playChord([midi], velocity);
}

/** Libera todos los AudioPlayer del pool. Llamar al desmontar la pantalla de la herramienta. */
export function releaseNoteSamples(): void {
  for (const { player } of notePool.values()) {
    try {
      player.remove();
    } catch (error) {
      console.warn('[chord-composer] No se pudo liberar un AudioPlayer:', error);
    }
  }
  notePool.clear();
}

