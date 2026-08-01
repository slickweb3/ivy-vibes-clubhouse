/**
 * The Chorus Pond vocabulary — the only words the pond accepts.
 *
 * A fixed list keeps the shared pond safe (no free text, nothing to moderate)
 * and doubles as the score: each croak owns one note of Ivy's D-Dorian theme,
 * so the pond's daily song is written by whoever showed up.
 *
 * Pure data + pure helpers only: imported by both the browser and the server.
 */

export interface Croak {
  /** Stable id stored in the database. */
  word: string;
  /** Semitone offset from D3 (MIDI 50) — the same home key as the game theme. */
  note: number;
  glyph: string;
  /** One-line meaning, shown when you hover a pad. */
  meaning: string;
}

/** 16 croaks, low to high — a full D-Dorian ladder across two octaves. */
export const CROAKS: Croak[] = [
  { word: "roots", note: 2, glyph: "🪵", meaning: "held the low end steady" },
  { word: "puddle", note: 5, glyph: "💧", meaning: "small water, big joy" },
  { word: "hop", note: 7, glyph: "🦿", meaning: "one good hop" },
  { word: "leaf", note: 9, glyph: "🍃", meaning: "drifted in gently" },
  { word: "woof", note: 10, glyph: "🐶", meaning: "a dog note in a frog song" },
  { word: "lily", note: 12, glyph: "🪷", meaning: "landed on the pad" },
  { word: "spine", note: 14, glyph: "✨", meaning: "short spine, long legend" },
  { word: "ribbit", note: 17, glyph: "🐸", meaning: "the classic" },
  { word: "vibe", note: 19, glyph: "🌀", meaning: "pure vibing" },
  { word: "queen", note: 21, glyph: "👑", meaning: "royal declaration" },
  { word: "zoom", note: 22, glyph: "💨", meaning: "full speed, no brakes" },
  { word: "splash", note: 24, glyph: "🌊", meaning: "cannonball entry" },
  { word: "sun", note: 26, glyph: "🌞", meaning: "warm patch of floor" },
  { word: "moon", note: 29, glyph: "🌙", meaning: "late-night pond thoughts" },
  { word: "boing", note: 31, glyph: "🎈", meaning: "physics optional" },
  { word: "chorus", note: 33, glyph: "🎶", meaning: "everybody at once" },
];

export const CROAK_WORDS = CROAKS.map((c) => c.word);

export function croakByWord(word: string): Croak | undefined {
  return CROAKS.find((c) => c.word === word);
}

export function croakByNote(note: number): Croak {
  return CROAKS.find((c) => c.note === note) ?? CROAKS[7]!;
}

/** UTC day key, so the whole pond changes over at the same moment. */
export function pondDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
