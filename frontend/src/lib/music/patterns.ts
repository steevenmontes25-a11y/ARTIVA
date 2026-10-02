export type ToneSel = "all" | number[];

export interface PatternEvent {
  /** Position in 16th notes within the bar (0-based). */
  at: number;
  tones: ToneSel;
  /** Length in 16th notes. */
  dur: number;
  vel: number;
  roll?: "up" | "down";
}

export interface PlayPattern {
  id: string;
  name: string;
  hint: string;
  beatsPerBar: 3 | 4;
  events: PatternEvent[];
}

export const PATTERNS: PlayPattern[] = [
  {
    id: "block",
    name: "Bloque",
    hint: "Acorde entero al entrar",
    beatsPerBar: 4,
    events: [{ at: 0, tones: "all", dur: 16, vel: 0.88 }],
  },
  {
    id: "quarters",
    name: "Negras",
    hint: "Un golpe por tiempo",
    beatsPerBar: 4,
    events: [0, 4, 8, 12].map((at) => ({ at, tones: "all" as const, dur: 4, vel: 0.8 })),
  },
  {
    id: "arp-up",
    name: "Arpegio ↑",
    hint: "1–3–5–8 en corcheas",
    beatsPerBar: 4,
    events: [0, 1, 2, 3, 0, 1, 2, 3].map((tone, i) => ({
      at: i * 2,
      tones: [tone],
      dur: 2,
      vel: 0.72 + (i % 4 === 0 ? 0.1 : 0),
    })),
  },
  {
    id: "arp-down",
    name: "Arpegio ↓",
    hint: "8–5–3–1 en corcheas",
    beatsPerBar: 4,
    events: [3, 2, 1, 0, 3, 2, 1, 0].map((tone, i) => ({
      at: i * 2,
      tones: [tone],
      dur: 2,
      vel: 0.72 + (i % 4 === 0 ? 0.1 : 0),
    })),
  },
  {
    id: "alberti",
    name: "Alberti",
    hint: "Bajo–quinta–tercera–quinta",
    beatsPerBar: 4,
    events: [0, 2, 1, 2, 0, 2, 1, 2].map((tone, i) => ({
      at: i * 2,
      tones: [tone],
      dur: 2,
      vel: tone === 0 ? 0.86 : 0.64,
    })),
  },
  {
    id: "strum",
    name: "Rasgueo",
    hint: "D  D U U D  U",
    beatsPerBar: 4,
    events: [
      { at: 0, tones: "all", dur: 4, vel: 0.9, roll: "down" },
      { at: 4, tones: "all", dur: 2, vel: 0.78, roll: "down" },
      { at: 6, tones: "all", dur: 2, vel: 0.7, roll: "up" },
      { at: 8, tones: "all", dur: 2, vel: 0.66, roll: "up" },
      { at: 10, tones: "all", dur: 4, vel: 0.84, roll: "down" },
      { at: 14, tones: "all", dur: 2, vel: 0.7, roll: "up" },
    ],
  },
  {
    id: "waltz",
    name: "Vals",
    hint: "Bajo – acorde – acorde",
    beatsPerBar: 3,
    events: [
      { at: 0, tones: [0], dur: 4, vel: 0.92 },
      { at: 4, tones: [1, 2, 3], dur: 4, vel: 0.68, roll: "up" },
      { at: 8, tones: [1, 2, 3], dur: 4, vel: 0.62, roll: "up" },
    ],
  },
  {
    id: "finger",
    name: "Fingerstyle",
    hint: "Travis: bajo y melodía",
    beatsPerBar: 4,
    events: [
      { at: 0, tones: [0], dur: 2, vel: 0.9 },
      { at: 2, tones: [2], dur: 2, vel: 0.62 },
      { at: 4, tones: [3], dur: 2, vel: 0.74 },
      { at: 6, tones: [1], dur: 2, vel: 0.6 },
      { at: 8, tones: [0], dur: 2, vel: 0.86 },
      { at: 10, tones: [2], dur: 2, vel: 0.6 },
      { at: 12, tones: [3], dur: 2, vel: 0.72 },
      { at: 14, tones: [1], dur: 2, vel: 0.58 },
    ],
  },
  {
    id: "broken",
    name: "Semicorcheas",
    hint: "Arpegio rápido 16ths",
    beatsPerBar: 4,
    events: Array.from({ length: 16 }, (_, i) => ({
      at: i,
      tones: [i % 4],
      dur: 1,
      vel: i % 4 === 0 ? 0.78 : 0.58,
    })),
  },
];

export const PATTERN_BY_ID: Record<string, PlayPattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
);

export function getPattern(id: string): PlayPattern {
  return PATTERN_BY_ID[id] ?? PATTERNS[0];
}
