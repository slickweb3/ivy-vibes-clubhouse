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

/** UTC day key — one pad per visitor per day. */
export function pondDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * UTC month key. The song itself is monthly: pads keep collecting all month,
 * so the chorus grows into a real piece of music, then the pond empties on the
 * first of the next month and a brand new song starts from silence.
 */
export function pondMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** First and last UTC day keys of a `YYYY-MM` month, inclusive. */
export function pondMonthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const year = y ?? new Date().getUTCFullYear();
  const index = (m ?? 1) - 1;
  const last = new Date(Date.UTC(year, index + 1, 0)).toISOString().slice(0, 10);
  return { from: `${month}-01`, to: last };
}

/** "August 2026" — the human name of a pond song. */
export function pondMonthLabel(month: string): string {
  const { from } = pondMonthRange(month);
  return new Date(`${from}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Milliseconds until the pond empties (first instant of the next UTC month). */
export function msUntilPondReset(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return Math.max(0, next - now.getTime());
}
