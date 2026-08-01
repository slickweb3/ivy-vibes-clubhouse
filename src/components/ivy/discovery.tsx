import { useCallback, useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import {
  DISCOVERIES,
  DISCOVERY_EVENT,
  countVisit,
  discover,
  readDiscoveries,
} from "@/lib/discoveries";

/**
 * IvyDiscoveries — the visible half of the discovery layer.
 *
 * A small lily-pad tally sits low on the right. Finding something plays a
 * quiet card, and the tally opens a journal of what you have found plus
 * hints (never answers) for what you have not. Progress is local to the
 * browser: nothing leaves the device.
 */

export function IvyDiscoveries({ context = "home" }: { context?: "home" | "arcade" }) {
  const [found, setFound] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Subscribe first so triggers fired during mount are never missed.
  useEffect(() => {
    setFound(readDiscoveries());
    setHydrated(true);
    const onFind = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;
      setFound(readDiscoveries());
      setToast(id);
    };
    window.addEventListener(DISCOVERY_EVENT, onFind);
    return () => window.removeEventListener(DISCOVERY_EVENT, onFind);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Ambient triggers that belong to the page itself, not to a component.
  useEffect(() => {
    const visits = countVisit();
    discover("arrive");
    if (visits > 1) discover("return");
    if (context === "arcade") discover("arcade");

    const linger = window.setTimeout(() => discover("linger"), 5 * 60 * 1000);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 400 && window.scrollY / max > 0.965) {
        discover("deep");
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(linger);
      window.removeEventListener("scroll", onScroll);
    };
  }, [context]);

  const openJournal = useCallback(() => {
    setOpen(true);
    setToast(null);
    discover("journal");
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const total = DISCOVERIES.length;
  const count = found.length;
  const active = toast ? DISCOVERIES.find((entry) => entry.id === toast) : null;

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        onClick={openJournal}
        aria-label={`Field journal — ${count} of ${total} discoveries found`}
        className="pop fixed right-3 bottom-52 z-40 flex items-center gap-2 rounded-full border-2 border-ivy/70 bg-cream/90 px-3 py-2 font-display text-sm text-ivy shadow-[0_6px_0_rgba(23,79,54,0.45)] backdrop-blur-sm sm:right-6 sm:bottom-56"
      >
        <span aria-hidden className="ivy-journal-pip">
          🪷
        </span>
        <span className="tabular-nums">
          {count}
          <span className="opacity-55">/{total}</span>
        </span>
      </button>

      {active ? (
        <div
          role="status"
          aria-live="polite"
          className="ivy-find-card fixed right-3 bottom-[17rem] z-50 max-w-[17rem] rounded-2xl border-2 border-ivy/70 bg-cream/95 p-3 text-ivy shadow-[0_10px_0_rgba(23,79,54,0.35)] sm:right-6 sm:bottom-[19rem]"
        >
          <p className="font-display text-[0.7rem] tracking-[0.18em] uppercase opacity-60">
            Discovery {count} of {total}
          </p>
          <p className="mt-1 flex items-center gap-2 font-display text-base leading-tight">
            <span aria-hidden>{active.glyph}</span>
            {active.title}
          </p>
          <p className="mt-1 text-sm leading-snug opacity-80">{active.note}</p>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-charcoal/70 p-3 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Field journal"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="ivy-find-card max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-3xl border-4 border-ivy bg-cream p-5 text-ivy shadow-[0_16px_0_rgba(21,21,21,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl leading-tight">Field journal</h2>
                <p className="mt-1 text-sm opacity-75">
                  {count} of {total} found. Kept on this device only — nothing is sent anywhere.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close journal"
                className="pop shrink-0 rounded-full border-2 border-ivy bg-frog p-2 text-ivy"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div
              aria-hidden
              className="mt-4 h-2 overflow-hidden rounded-full border-2 border-ivy/40 bg-ivy/10"
            >
              <div
                className="h-full rounded-full bg-frog transition-[width] duration-700 ease-out"
                style={{ width: `${Math.round((count / total) * 100)}%` }}
              />
            </div>

            <ul className="mt-4 grid gap-2">
              {DISCOVERIES.map((entry) => {
                const got = found.includes(entry.id);
                return (
                  <li
                    key={entry.id}
                    className={
                      got
                        ? "flex gap-3 rounded-2xl border-2 border-ivy/60 bg-leaf/50 p-3"
                        : "flex gap-3 rounded-2xl border-2 border-dashed border-ivy/30 p-3 opacity-70"
                    }
                  >
                    <span aria-hidden className="text-lg leading-none">
                      {got ? entry.glyph : "❔"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm leading-tight">
                        {got ? entry.title : "Undiscovered"}
                      </p>
                      <p className="text-sm leading-snug opacity-80">
                        {got ? entry.note : entry.hint}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {count === total ? (
              <p className="mt-4 rounded-2xl border-2 border-ivy bg-yellow/60 p-3 text-center font-display text-sm">
                Everything found. Ivy is genuinely impressed, and so is her owner.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
