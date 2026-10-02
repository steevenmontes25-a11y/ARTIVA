// Mapa estático MIDI -> asset local. Metro exige rutas de `require()`
// literales (no se puede armar dinámicamente `require(`midi-${n}.wav`)`),
// así que este archivo enumera a mano las 24 muestras generadas por
// scripts/generate-piano-samples.js — ver ese script para el porqué de que
// sean sintetizadas en vez de grabadas (timbre de piano suave, sin
// dependencia de una fuente/licencia externa).
//
// Cobertura: C3 (MIDI 48) a B4 (MIDI 71), dos octavas, un semitono por
// archivo. Una nota fuera de este rango se resuelve en player.ts tomando la
// muestra más cercana y ajustando el tono con `playbackRate` (más simple
// que grabar/generar más octavas, y expo-audio ya expone ese control).
export const NOTE_SAMPLE_MIN_MIDI = 48;
export const NOTE_SAMPLE_MAX_MIDI = 71;

// `require()` de un asset local devuelve el id numérico de módulo que
// espera `AudioSource` de expo-audio (ver createAudioPlayer).
export const noteSampleAssets: Record<number, number> = {
  48: require('../../../assets/audio/notes/midi-48.wav'),
  49: require('../../../assets/audio/notes/midi-49.wav'),
  50: require('../../../assets/audio/notes/midi-50.wav'),
  51: require('../../../assets/audio/notes/midi-51.wav'),
  52: require('../../../assets/audio/notes/midi-52.wav'),
  53: require('../../../assets/audio/notes/midi-53.wav'),
  54: require('../../../assets/audio/notes/midi-54.wav'),
  55: require('../../../assets/audio/notes/midi-55.wav'),
  56: require('../../../assets/audio/notes/midi-56.wav'),
  57: require('../../../assets/audio/notes/midi-57.wav'),
  58: require('../../../assets/audio/notes/midi-58.wav'),
  59: require('../../../assets/audio/notes/midi-59.wav'),
  60: require('../../../assets/audio/notes/midi-60.wav'),
  61: require('../../../assets/audio/notes/midi-61.wav'),
  62: require('../../../assets/audio/notes/midi-62.wav'),
  63: require('../../../assets/audio/notes/midi-63.wav'),
  64: require('../../../assets/audio/notes/midi-64.wav'),
  65: require('../../../assets/audio/notes/midi-65.wav'),
  66: require('../../../assets/audio/notes/midi-66.wav'),
  67: require('../../../assets/audio/notes/midi-67.wav'),
  68: require('../../../assets/audio/notes/midi-68.wav'),
  69: require('../../../assets/audio/notes/midi-69.wav'),
  70: require('../../../assets/audio/notes/midi-70.wav'),
  71: require('../../../assets/audio/notes/midi-71.wav'),
};
