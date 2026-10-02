export const PC_NAMES_SHARP = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;

export const PC_NAMES_FLAT = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;

export const TONICS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const FLAT_TONICS = new Set([1, 3, 5, 8, 10]);

export type Quality =
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "7"
  | "maj7"
  | "m7"
  | "m7b5"
  | "dim7"
  | "sus2"
  | "sus4"
  | "6"
  | "m6"
  | "add9"
  | "9";

export const QUALITIES: { id: Quality; label: string }[] = [
  { id: "maj", label: "maj" },
  { id: "min", label: "m" },
  { id: "dim", label: "dim" },
  { id: "aug", label: "aug" },
  { id: "7", label: "7" },
  { id: "maj7", label: "maj7" },
  { id: "m7", label: "m7" },
  { id: "m7b5", label: "m7♭5" },
  { id: "dim7", label: "dim7" },
  { id: "sus2", label: "sus2" },
  { id: "sus4", label: "sus4" },
  { id: "6", label: "6" },
  { id: "m6", label: "m6" },
  { id: "add9", label: "add9" },
  { id: "9", label: "9" },
];

export const QUALITY_INTERVALS: Record<Quality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
  "9": [0, 4, 7, 10, 14],
};

export type ModeId = "major" | "minor" | "harmonic" | "dorian" | "mixolydian";

export interface ModeDef {
  id: ModeId;
  name: string;
  intervals: number[];
  qualities: Quality[];
  romans: string[];
}

export const MODES: ModeDef[] = [
  {
    id: "major",
    name: "Mayor",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ["maj", "min", "min", "maj", "maj", "min", "dim"],
    romans: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  },
  {
    id: "minor",
    name: "Menor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ["min", "dim", "maj", "min", "min", "maj", "maj"],
    romans: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
  },
  {
    id: "harmonic",
    name: "Menor arm.",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    qualities: ["min", "dim", "aug", "min", "maj", "maj", "dim"],
    romans: ["i", "ii°", "III+", "iv", "V", "VI", "vii°"],
  },
  {
    id: "dorian",
    name: "Dórico",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    qualities: ["min", "min", "maj", "maj", "min", "dim", "maj"],
    romans: ["i", "ii", "♭III", "IV", "v", "vi°", "♭VII"],
  },
  {
    id: "mixolydian",
    name: "Mixolidio",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    qualities: ["maj", "min", "dim", "maj", "min", "min", "maj"],
    romans: ["I", "ii", "iii°", "IV", "v", "vi", "♭VII"],
  },
];

export const MODE_BY_ID: Record<ModeId, ModeDef> = Object.fromEntries(
  MODES.map((m) => [m.id, m]),
) as Record<ModeId, ModeDef>;

export type Accidental = -1 | 0 | 1;
export type Inversion = 0 | 1 | 2 | 3;
export type BeatLength = 1 | 2 | 3 | 4;

export interface ChordSlot {
  id: string;
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  accidental: Accidental;
  quality: Quality;
  inversion: Inversion;
  beats: BeatLength;
}

export function preferFlats(tonic: number): boolean {
  return FLAT_TONICS.has(tonic);
}

export function pcName(pc: number, flats = false): string {
  const n = ((pc % 12) + 12) % 12;
  return flats ? PC_NAMES_FLAT[n] : PC_NAMES_SHARP[n];
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function midiName(midi: number, flats = false): string {
  const name = pcName(midi, flats);
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function getMode(id: ModeId): ModeDef {
  return MODE_BY_ID[id];
}

export function degreeRootPc(tonic: number, mode: ModeId, degree: number, accidental: Accidental): number {
  const intervals = getMode(mode).intervals;
  const idx = Math.max(1, Math.min(7, degree)) - 1;
  return (tonic + intervals[idx] + accidental + 12) % 12;
}

function isMinorish(q: Quality): boolean {
  return q === "min" || q === "m7" || q === "m6" || q === "m7b5" || q === "dim" || q === "dim7";
}

export function romanNumeral(slot: ChordSlot): string {
  const bases = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const acc = slot.accidental === -1 ? "♭" : slot.accidental === 1 ? "♯" : "";
  let body = bases[slot.degree - 1];
  if (isMinorish(slot.quality)) body = body.toLowerCase();
  let r = `${acc}${body}`;
  if (slot.quality === "dim" || slot.quality === "dim7") r += "°";
  else if (slot.quality === "m7b5") r += "ø";
  else if (slot.quality === "aug") r += "+";
  if (slot.quality === "7" || slot.quality === "m7" || slot.quality === "9") r += "⁷";
  else if (slot.quality === "maj7") r += "Δ";
  else if (slot.quality === "dim7") r += "⁷";
  else if (slot.quality === "6" || slot.quality === "m6") r += "⁶";
  else if (slot.quality === "sus2") r += "sus2";
  else if (slot.quality === "sus4") r += "sus4";
  else if (slot.quality === "add9") r += "add9";
  return r;
}

export function qualitySuffix(q: Quality): string {
  switch (q) {
    case "maj":
      return "";
    case "min":
      return "m";
    case "dim":
      return "dim";
    case "aug":
      return "aug";
    case "7":
      return "7";
    case "maj7":
      return "maj7";
    case "m7":
      return "m7";
    case "m7b5":
      return "m7♭5";
    case "dim7":
      return "dim7";
    case "sus2":
      return "sus2";
    case "sus4":
      return "sus4";
    case "6":
      return "6";
    case "m6":
      return "m6";
    case "add9":
      return "add9";
    case "9":
      return "9";
  }
}

export function chordSymbol(tonic: number, mode: ModeId, slot: ChordSlot): string {
  const root = degreeRootPc(tonic, mode, slot.degree, slot.accidental);
  return `${pcName(root, preferFlats(tonic))}${qualitySuffix(slot.quality)}`;
}

export function diatonicQuality(mode: ModeId, degree: number): Quality {
  return getMode(mode).qualities[Math.max(1, Math.min(7, degree)) - 1];
}

/** Comfortable piano voicing around C3–G4. */
export function voiceChord(rootPc: number, quality: Quality, inversion: Inversion): number[] {
  const intervals = QUALITY_INTERVALS[quality];
  const base = 48 + rootPc;
  let notes = intervals.map((iv) => base + iv);
  const nInv = Math.min(inversion, notes.length - 1);
  for (let i = 0; i < nInv; i++) {
    const n = notes.shift();
    if (n !== undefined) notes.push(n + 12);
  }
  if (notes.length <= 3) {
    notes = [...notes, notes[0] + 12];
  }
  while (notes[0] < 48) notes = notes.map((n) => n + 12);
  while (notes[notes.length - 1] > 79) notes = notes.map((n) => n - 12);
  return notes.sort((a, b) => a - b);
}

export function slotNotes(tonic: number, mode: ModeId, slot: ChordSlot): number[] {
  const root = degreeRootPc(tonic, mode, slot.degree, slot.accidental);
  return voiceChord(root, slot.quality, slot.inversion);
}

export function makeSlot(
  partial: Omit<ChordSlot, "id"> & { id?: string },
): ChordSlot {
  return {
    id: partial.id ?? `ch-${Math.random().toString(36).slice(2, 9)}`,
    degree: partial.degree,
    accidental: partial.accidental,
    quality: partial.quality,
    inversion: partial.inversion,
    beats: partial.beats,
  };
}

export function diatonicSlot(mode: ModeId, degree: ChordSlot["degree"], beats: BeatLength = 4): ChordSlot {
  return makeSlot({
    degree,
    accidental: 0,
    quality: diatonicQuality(mode, degree),
    inversion: 0,
    beats,
  });
}

export const DEGREE_CHIPS: { degree: ChordSlot["degree"]; accidental: Accidental; label: string }[] = [
  { degree: 1, accidental: 0, label: "I" },
  { degree: 2, accidental: -1, label: "♭II" },
  { degree: 2, accidental: 0, label: "II" },
  { degree: 3, accidental: -1, label: "♭III" },
  { degree: 3, accidental: 0, label: "III" },
  { degree: 4, accidental: 0, label: "IV" },
  { degree: 5, accidental: 0, label: "V" },
  { degree: 6, accidental: -1, label: "♭VI" },
  { degree: 6, accidental: 0, label: "VI" },
  { degree: 7, accidental: -1, label: "♭VII" },
  { degree: 7, accidental: 0, label: "VII" },
];
