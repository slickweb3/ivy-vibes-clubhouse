/**
 * The discovery layer — the part of the pond that remembers.
 *
 * A tiny, dependency-free, local-only progression store. No network, no
 * wallet, no personal data: just a set of discovery ids in localStorage plus
 * a browser event so any component can light up the HUD by calling
 * `discover("id")`.
 *
 * Everything is SSR-safe (all reads/writes are guarded) and cheap.
 */

export interface Discovery {
  id: string;
  /** Shown once found. */
  title: string;
  /** Shown once found — one warm line, Ivy's voice. */
  note: string;
  /** Shown while still hidden — a nudge, never the answer. */
  hint: string;
  glyph: string;
}

/** Ordered so the journal reads like a little expedition log. */
export const DISCOVERIES: Discovery[] = [
  {
    id: "arrive",
    title: "Arrived at the pond",
    note: "The water noticed you land.",
    hint: "Simply show up.",
    glyph: "🌿",
  },
  {
    id: "return",
    title: "The pond remembers",
    note: "You came back. Ivy assumed you would.",
    hint: "Leave, then come back another time.",
    glyph: "💧",
  },
  {
    id: "deep",
    title: "Reached the roots",
    note: "All the way down, where the lore keeps its receipts.",
    hint: "Something waits at the very bottom.",
    glyph: "🪵",
  },
  {
    id: "flip",
    title: "Backflip witnessed",
    note: "Four hops in and she showed off. Of course she did.",
    hint: "Keep tapping the sticker in the corner.",
    glyph: "🤸",
  },
  {
    id: "double",
    title: "Double backflip",
    note: "10/10 landing. No notes.",
    hint: "Four hops was not enough.",
    glyph: "🌀",
  },
  {
    id: "gaze",
    title: "Direct eye contact",
    note: "You opened a frame and she held the stare.",
    hint: "Look closer at a photograph.",
    glyph: "👁️",
  },
  {
    id: "listen",
    title: "Heard the pond",
    note: "Ambience on. The frogs approve.",
    hint: "The pond has a sound, if you allow it.",
    glyph: "🔊",
  },
  {
    id: "ribbit",
    title: "Spoke frog",
    note: "You said the word out loud-ish and the sky answered.",
    hint: "Six letters, typed anywhere. Frogs say it.",
    glyph: "🐸",
  },
  {
    id: "arcade",
    title: "Found the arcade",
    note: "A lost piece of 1998 technology, still humming.",
    hint: "There is a machine somewhere on this site.",
    glyph: "🕹️",
  },
  {
    id: "leap",
    title: "First leap logged",
    note: "One run down. The lily pads remember your name.",
    hint: "Playing beats watching.",
    glyph: "🏅",
  },
  {
    id: "linger",
    title: "Lingered a while",
    note: "Five quiet minutes in the clubhouse. Thank you for staying.",
    hint: "Some things only happen if you stay.",
    glyph: "🕰️",
  },
  {
    id: "journal",
    title: "Opened the journal",
    note: "You wanted to know how deep this goes. It goes deeper.",
    hint: "You are already here.",
    glyph: "📖",
  },
];

const KEY = "ivy-discoveries";
const VISIT_KEY = "ivy-visits";
export const DISCOVERY_EVENT = "ivy:discovery";

function canStore() {
  return typeof window !== "undefined";
}

export function readDiscoveries(): string[] {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Records a discovery. Returns true only the first time it is found. */
export function discover(id: string): boolean {
  if (!canStore()) return false;
  const found = readDiscoveries();
  if (found.includes(id)) return false;
  const next = [...found, id];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — the discovery still fires for this session */
  }
  window.dispatchEvent(new CustomEvent(DISCOVERY_EVENT, { detail: { id } }));
  return true;
}

/** Increments and returns the visit counter (once per browser session). */
export function countVisit(): number {
  if (!canStore()) return 1;
  try {
    const already = window.sessionStorage.getItem("ivy-visit-counted") === "1";
    const visits = Number(window.localStorage.getItem(VISIT_KEY) ?? "0") || 0;
    if (already) return visits;
    const next = visits + 1;
    window.localStorage.setItem(VISIT_KEY, String(next));
    window.sessionStorage.setItem("ivy-visit-counted", "1");
    return next;
  } catch {
    return 1;
  }
}
