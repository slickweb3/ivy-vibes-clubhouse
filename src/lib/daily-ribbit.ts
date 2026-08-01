/**
 * Ivy's Daily Ribbit — a once-a-day pond oracle.
 *
 * Local-only (no network, no wallet, no personal data). Each calendar day has
 * one deterministic reading derived from the date itself, so everybody in the
 * pond gets the same ribbit on the same day — a shared daily ritual that is
 * still cheap and private. Streaks and collected stamps live in localStorage.
 */

export interface Ribbit {
  /** Short stamp name kept in the lily pond grid. */
  stamp: string;
  glyph: string;
  /** The reading itself, in Ivy's voice. */
  reading: string;
  /** A tiny prompt for the day — never financial advice. */
  quest: string;
}

export const RIBBITS: Ribbit[] = [
  {
    stamp: "Sunbeam",
    glyph: "🌞",
    reading: "Today the good patch of sun belongs to you. Claim it shamelessly.",
    quest: "Sit somewhere warm for five whole minutes.",
  },
  {
    stamp: "Big Stretch",
    glyph: "🧘",
    reading: "A long spine is overrated. A long stretch is not.",
    quest: "Stretch like nobody is filming. Ivy always assumes they are.",
  },
  {
    stamp: "Ribbit",
    glyph: "🐸",
    reading: "The frogs are chatty today, which means your idea is louder than you think.",
    quest: "Say the loud thing to one person.",
  },
  {
    stamp: "Zoomies",
    glyph: "💨",
    reading: "Energy arrives without warning. Spend it, do not store it.",
    quest: "Move fast at something small.",
  },
  {
    stamp: "Snack Luck",
    glyph: "🍗",
    reading: "Something falls off a counter in your favour today.",
    quest: "Accept the free thing gracefully.",
  },
  {
    stamp: "Head Tilt",
    glyph: "🤨",
    reading: "Confusion is just curiosity with better posture. Tilt and continue.",
    quest: "Ask the question you assumed was silly.",
  },
  {
    stamp: "Puddle Day",
    glyph: "💧",
    reading: "Small mess, big joy. The pond approves of the trade.",
    quest: "Do the fun version instead of the tidy version.",
  },
  {
    stamp: "Crown Day",
    glyph: "👑",
    reading: "The Short Spine Queen recognises another royal. That is you, obviously.",
    quest: "Take up the amount of space you actually deserve.",
  },
  {
    stamp: "Lily Leap",
    glyph: "🪷",
    reading: "One pad at a time is still crossing the whole pond.",
    quest: "Take one hop on the thing you keep postponing.",
  },
  {
    stamp: "Loaf Mode",
    glyph: "🍞",
    reading: "Nothing needs doing at full speed. Loaf with intent.",
    quest: "Rest before you have earned it. Ivy insists.",
  },
  {
    stamp: "Nose Boop",
    glyph: "👃",
    reading: "Someone is thinking about you fondly and will not admit it.",
    quest: "Send the message first.",
  },
  {
    stamp: "Night Pond",
    glyph: "🌙",
    reading: "Quiet hours are where the lore gets written. Yours included.",
    quest: "Write one line down before you sleep.",
  },
  {
    stamp: "Tongue Out",
    glyph: "👅",
    reading: "Dignity is optional today. Charm is mandatory.",
    quest: "Be silly on purpose, in public.",
  },
  {
    stamp: "Good Log",
    glyph: "🪵",
    reading: "An obstacle turns out to be a place to sit. Reframe it.",
    quest: "Turn one annoyance into a resting spot.",
  },
  {
    stamp: "Chorus",
    glyph: "🎶",
    reading: "The pond sings together today. Your part matters even if it is off-key.",
    quest: "Show up for somebody else's thing.",
  },
  {
    stamp: "Fresh Grass",
    glyph: "🌿",
    reading: "New ground under your feet. Sniff it thoroughly before committing.",
    quest: "Start something at 10% effort.",
  },
];

const STAMPS_KEY = "ivy-ribbit-stamps"; // { [YYYY-MM-DD]: stampIndex }
export const RIBBIT_EVENT = "ivy:ribbit";

export interface RibbitState {
  /** ISO dates already opened, newest first. */
  days: string[];
  streak: number;
  longestStreak: number;
  todayOpened: boolean;
}

export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Stable per-day hash so everyone sees the same reading on the same date. */
export function ribbitForDay(key: string): Ribbit {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % RIBBITS.length;
  return RIBBITS[index]!;
}

function canStore() {
  return typeof window !== "undefined";
}

function readDays(): string[] {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(STAMPS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + delta);
  return todayKey(date);
}

function streakFrom(days: string[], today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

function longestFrom(days: string[]): number {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous && shiftDay(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export function readRibbitState(): RibbitState {
  const today = todayKey();
  const days = readDays();
  return {
    days,
    streak: streakFrom(days, today),
    longestStreak: longestFrom(days),
    todayOpened: days.includes(today),
  };
}

/** Opens today's ribbit. Returns the new state; safe to call twice. */
export function openRibbit(): RibbitState {
  const today = todayKey();
  if (canStore()) {
    const days = readDays();
    if (!days.includes(today)) {
      try {
        window.localStorage.setItem(STAMPS_KEY, JSON.stringify([...days, today]));
      } catch {
        /* private mode — the reading still shows for this session */
      }
    }
    window.dispatchEvent(new CustomEvent(RIBBIT_EVENT, { detail: { day: today } }));
  }
  return readRibbitState();
}

/** The last `count` calendar days, newest last, for the pond grid. */
export function recentDays(count = 14): string[] {
  const today = todayKey();
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) out.push(shiftDay(today, -i));
  return out;
}

/** Milliseconds until the next pond reading unlocks. */
export function msUntilTomorrow(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}
