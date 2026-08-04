/**
 * Tiny "first time" tracker.
 *
 * The field journal UI is gone; what remains is the one thing it was actually
 * useful for — knowing whether a playful interaction (a backflip, the ribbit
 * sequence, a first chat message) is happening for the first time, so the
 * soundscape can answer with a reward cue instead of repeating itself.
 *
 * No wallet, no personal data: just a list of ids in localStorage.
 */
const KEY = "ivy-discoveries";

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
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...found, id]));
  } catch {
    /* private mode — the cue still fires for this session */
  }
  window.dispatchEvent(new CustomEvent(DISCOVERY_EVENT, { detail: { id } }));
  return true;
}
