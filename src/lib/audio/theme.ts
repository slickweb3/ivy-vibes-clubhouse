/**
 * "The Legend of Frog Queen Ivy" — the single melodic source of truth.
 *
 * One theme, one key, one arrangement skeleton, shared by the arcade synth
 * (`src/lib/game-audio.ts`), which powers both the arcade and the site player,
 * so the whole world sings the same tune. The game plays it buoyant; the site
 * plays it slower, sparser and quieter — same melody, calmer performance.
 *
 * All numbers are semitone offsets from D3 (MIDI 50), the D-Dorian home.
 */

/** D3, the root the whole world tunes to. */
export const THEME_ROOT_MIDI = 50;
export const THEME_ROOT_HZ = 146.83;

const R = null;

/** 64 sixteenth-notes: the heroic call, its lift, the answer, then home. */
// prettier-ignore
export const MELODY: (number | null)[] = [
  // bar 1 — the call
  19, R, R, 14, R, 12, R, 14, 19, R, R, R, 21, R, 19, R,
  // bar 2 — lift
  17, R, R, 12, R, 10, R, 12, 17, R, R, R, 19, R, 17, R,
  // bar 3 — the answer
  22, R, 21, R, 19, R, 17, R, 19, R, R, 14, R, R, 12, R,
  // bar 4 — resolve home
  10, R, 12, R, 14, R, 17, R, 19, R, R, R, R, R, R, R,
];

/** High counter-melody, saved for the fastest part of a run. */
// prettier-ignore
export const COUNTER: (number | null)[] = [
  31, R, R, R, 26, R, R, R, 31, R, R, R, 33, R, R, R,
  29, R, R, R, 24, R, R, R, 29, R, R, R, 31, R, R, R,
  34, R, R, R, 31, R, R, R, 29, R, R, R, 26, R, R, R,
  22, R, 24, R, 26, R, 29, R, 31, R, R, R, R, R, R, R,
];

/** Root of each bar, walked in bouncy octaves by the bass. */
export const BASS_ROOTS = [2, -2, 5, 0];

/** Rolling chord shape the harp/kalimba threads between melody notes. */
export const HARP_SHAPE = [0, 7, 10, 14, 19];
