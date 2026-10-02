import { makeSlot, type BeatLength, type ChordSlot, type ModeId, type Quality } from "./theory";

interface SlotSpec {
  degree: ChordSlot["degree"];
  accidental?: ChordSlot["accidental"];
  quality: Quality;
  beats?: BeatLength;
  inversion?: ChordSlot["inversion"];
}

export interface ProgressionPreset {
  id: string;
  name: string;
  subtitle: string;
  mode: ModeId;
  slots: SlotSpec[];
}

function slots(specs: SlotSpec[]): ChordSlot[] {
  return specs.map((s) =>
    makeSlot({
      degree: s.degree,
      accidental: s.accidental ?? 0,
      quality: s.quality,
      inversion: s.inversion ?? 0,
      beats: s.beats ?? 4,
    }),
  );
}

export const PRESETS: ProgressionPreset[] = [
  {
    id: "pop",
    name: "Pop",
    subtitle: "I – V – vi – IV",
    mode: "major",
    slots: [
      { degree: 1, quality: "maj" },
      { degree: 5, quality: "maj" },
      { degree: 6, quality: "min" },
      { degree: 4, quality: "maj" },
    ],
  },
  {
    id: "fifties",
    name: "Años 50",
    subtitle: "I – vi – IV – V",
    mode: "major",
    slots: [
      { degree: 1, quality: "maj" },
      { degree: 6, quality: "min" },
      { degree: 4, quality: "maj" },
      { degree: 5, quality: "maj" },
    ],
  },
  {
    id: "sensitive",
    name: "Axis",
    subtitle: "vi – IV – I – V",
    mode: "major",
    slots: [
      { degree: 6, quality: "min" },
      { degree: 4, quality: "maj" },
      { degree: 1, quality: "maj" },
      { degree: 5, quality: "maj" },
    ],
  },
  {
    id: "classic",
    name: "Cadencia",
    subtitle: "I – IV – V – I",
    mode: "major",
    slots: [
      { degree: 1, quality: "maj" },
      { degree: 4, quality: "maj" },
      { degree: 5, quality: "maj" },
      { degree: 1, quality: "maj" },
    ],
  },
  {
    id: "canon",
    name: "Canon",
    subtitle: "Pachelbel",
    mode: "major",
    slots: [
      { degree: 1, quality: "maj", beats: 2 },
      { degree: 5, quality: "maj", beats: 2 },
      { degree: 6, quality: "min", beats: 2 },
      { degree: 3, quality: "min", beats: 2 },
      { degree: 4, quality: "maj", beats: 2 },
      { degree: 1, quality: "maj", beats: 2 },
      { degree: 4, quality: "maj", beats: 2 },
      { degree: 5, quality: "maj", beats: 2 },
    ],
  },
  {
    id: "jazz",
    name: "ii – V – I",
    subtitle: "Jazz",
    mode: "major",
    slots: [
      { degree: 2, quality: "m7" },
      { degree: 5, quality: "7" },
      { degree: 1, quality: "maj7", beats: 4 },
    ],
  },
  {
    id: "turnaround",
    name: "Turnaround",
    subtitle: "I – vi – ii – V",
    mode: "major",
    slots: [
      { degree: 1, quality: "maj7", beats: 2 },
      { degree: 6, quality: "m7", beats: 2 },
      { degree: 2, quality: "m7", beats: 2 },
      { degree: 5, quality: "7", beats: 2 },
    ],
  },
  {
    id: "blues",
    name: "Blues 12",
    subtitle: "I7 – IV7 – V7",
    mode: "major",
    slots: [
      { degree: 1, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 4, quality: "7" },
      { degree: 4, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 5, quality: "7" },
      { degree: 4, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 5, quality: "7" },
    ],
  },
  {
    id: "rock",
    name: "Rock",
    subtitle: "I – ♭VII – IV",
    mode: "mixolydian",
    slots: [
      { degree: 1, quality: "maj" },
      { degree: 7, accidental: -1, quality: "maj" },
      { degree: 4, quality: "maj" },
      { degree: 1, quality: "maj" },
    ],
  },
  {
    id: "creep",
    name: "Creep",
    subtitle: "I – III – IV – iv",
    mode: "major",
    slots: [
      { degree: 1, quality: "maj" },
      { degree: 3, quality: "maj" },
      { degree: 4, quality: "maj" },
      { degree: 4, quality: "min" },
    ],
  },
  {
    id: "andalusian",
    name: "Andaluza",
    subtitle: "i – ♭VII – ♭VI – V",
    mode: "harmonic",
    slots: [
      { degree: 1, quality: "min" },
      { degree: 7, accidental: -1, quality: "maj" },
      { degree: 6, accidental: -1, quality: "maj" },
      { degree: 5, quality: "maj" },
    ],
  },
  {
    id: "minor-pop",
    name: "Pop menor",
    subtitle: "i – VI – III – VII",
    mode: "minor",
    slots: [
      { degree: 1, quality: "min" },
      { degree: 6, quality: "maj" },
      { degree: 3, quality: "maj" },
      { degree: 7, quality: "maj" },
    ],
  },
  {
    id: "sad",
    name: "Balada",
    subtitle: "i – iv – VI – V",
    mode: "harmonic",
    slots: [
      { degree: 1, quality: "min" },
      { degree: 4, quality: "min" },
      { degree: 6, quality: "maj" },
      { degree: 5, quality: "maj" },
    ],
  },
  {
    id: "dorian-vamp",
    name: "Dórica",
    subtitle: "i – IV – i – ♭VII",
    mode: "dorian",
    slots: [
      { degree: 1, quality: "min" },
      { degree: 4, quality: "maj" },
      { degree: 1, quality: "min" },
      { degree: 7, accidental: -1, quality: "maj" },
    ],
  },
];

export function presetSlots(preset: ProgressionPreset): ChordSlot[] {
  return slots(preset.slots);
}

export const PRESET_BY_ID: Record<string, ProgressionPreset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
);
