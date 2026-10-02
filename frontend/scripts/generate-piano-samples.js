// Genera 24 muestras cortas de "piano suave" (C3–B4, dos octavas, un
// semitono por archivo) para la herramienta de composición de acordes.
//
// Son SINTETIZADAS localmente (suma de armónicos con decaimiento propio por
// armónico, sin muestras grabadas de un piano real) — no hay licencia que
// verificar ni dependencia de una fuente externa. No suenan idénticas a un
// piano acústico grabado, pero sí a un tono cálido/suave adecuado para
// escuchar acordes con claridad. Si más adelante se consiguen samples reales
// (p. ej. de una librería con licencia clara), este script deja de usarse y
// se reemplazan los .wav de assets/audio/notes/ directamente.
//
// Uso: node scripts/generate-piano-samples.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 1.6;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'notes');

// C3 a B4 — dos octavas completas, 24 semitonos.
const START_MIDI = 48;
const END_MIDI = 71;

// Amplitud relativa y decaimiento (por segundo, en el exponente de e^-kt)
// de cada armónico — los agudos se apagan más rápido que el fundamental,
// lo que da un timbre que se "calienta"/suaviza a medida que decae, en vez
// de sonar como un tono puro sostenido.
const HARMONICS = [
  { mult: 1, amp: 1.0, decay: 1.1 },
  { mult: 2, amp: 0.45, decay: 1.6 },
  { mult: 3, amp: 0.22, decay: 2.2 },
  { mult: 4, amp: 0.12, decay: 2.8 },
  { mult: 5, amp: 0.06, decay: 3.4 },
  { mult: 6, amp: 0.03, decay: 4.0 },
];

const ATTACK_SECONDS = 0.004;
const RELEASE_SECONDS = 0.08;
// Pico tras normalizar (no 1.0): dejar margen para cuando varias notas de
// un acorde suenan juntas (cada una es un AudioPlayer independiente, se
// suman en la salida real del dispositivo) sin saturar.
const PEAK_AMPLITUDE = 0.55;

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function synthesizeNote(midi) {
  const totalSamples = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
  const freq = midiToFrequency(midi);
  const samples = new Float32Array(totalSamples);

  const attackSamples = Math.floor(SAMPLE_RATE * ATTACK_SECONDS);
  const releaseStart = totalSamples - Math.floor(SAMPLE_RATE * RELEASE_SECONDS);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let value = 0;

    for (const harmonic of HARMONICS) {
      value += harmonic.amp * Math.sin(2 * Math.PI * freq * harmonic.mult * t) * Math.exp(-t * harmonic.decay);
    }

    let envelope = 1;
    if (i < attackSamples) {
      envelope = i / attackSamples;
    }
    if (i > releaseStart) {
      envelope *= Math.max(0, (totalSamples - i) / (totalSamples - releaseStart));
    }

    samples[i] = value * envelope;
  }

  return samples;
}

function normalize(samples, peak) {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    max = Math.max(max, Math.abs(samples[i]));
  }
  if (max === 0) {
    return samples;
  }
  const scale = peak / max;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = samples[i] * scale;
  }
  return out;
}

function writeWavFile(filePath, samples, sampleRate) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }

  fs.writeFileSync(filePath, buffer);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
  const raw = synthesizeNote(midi);
  const normalized = normalize(raw, PEAK_AMPLITUDE);
  const filePath = path.join(OUTPUT_DIR, `midi-${midi}.wav`);
  writeWavFile(filePath, normalized, SAMPLE_RATE);
  console.log(`Generado ${filePath}`);
}

console.log(`\nListo: ${END_MIDI - START_MIDI + 1} muestras en ${OUTPUT_DIR}`);
