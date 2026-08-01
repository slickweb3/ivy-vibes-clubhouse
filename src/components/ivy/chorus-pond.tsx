import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section, Sticker } from "@/components/ivy/primitives";
import { FrogDoodle } from "@/components/ivy/doodles";
import { discover } from "@/lib/discoveries";
import { getPond, plantPondPad } from "@/lib/pond.functions";
import { CROAKS, croakByNote, pondDay, type Croak } from "@/lib/pond-vocabulary";
import { playPadNote, playPondSong, type SongHandle } from "@/lib/pond-song";
import type { PondPad } from "@/lib/pond.server";

/**
 * The Chorus Pond — the pond writes one song a day, and the visitors are the notes.
 *
 * Every visitor may plant exactly one lily pad per UTC day: they pick a croak,
 * drop it anywhere in the water, and that croak becomes a note in Ivy's theme.
 * Press play and you hear the day itself — in the order people arrived. Pads
 * bloom live as strangers plant them, then the whole pond is wiped at midnight
 * UTC and a brand new song starts from silence.
 */

const PLANTER_KEY = "ivy-pond-planter";
const PLANTED_PREFIX = "ivy-pond-planted-";

function planterId(): string {
  try {
    const existing = window.localStorage.getItem(PLANTER_KEY);
    if (existing && existing.length >= 8) return existing;
    const next =
      window.crypto?.randomUUID?.() ?? `p${Math.random().toString(36).slice(2)}${Date.now()}`;
    window.localStorage.setItem(PLANTER_KEY, next);
    return next;
  } catch {
    return `p${Math.random().toString(36).slice(2)}${Date.now()}`;
  }
}

function msUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, next - now.getTime());
}

function formatLeft(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${`${m}`.padStart(2, "0")}m`;
}

export function ChorusPond() {
  const [pads, setPads] = useState<PondPad[]>([]);
  const [day, setDay] = useState(() => pondDay());
  const [loaded, setLoaded] = useState(false);
  const [croak, setCroak] = useState<Croak>(CROAKS[7]!);
  const [planted, setPlanted] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const [left, setLeft] = useState(0);
  const songRef = useRef<SongHandle | null>(null);
  const waterRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let alive = true;
    void getPond()
      .then((state) => {
        if (!alive) return;
        setPads(state.pads);
        setDay(state.day);
        try {
          setPlanted(window.localStorage.getItem(`${PLANTED_PREFIX}${state.day}`) === "1");
        } catch {
          /* private mode — they simply get told by the server instead */
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setLeft(msUntilUtcMidnight());
    const timer = window.setInterval(() => setLeft(msUntilUtcMidnight()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Live blooms: pads planted by other people appear without a refresh.
  useEffect(() => {
    if (!loaded) return undefined;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
      const supabase = await getSupabaseBrowserClient();
      if (cancelled) return;
      const channel = supabase
        .channel("chorus-pond")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "pond_pads", filter: `day=eq.${day}` },
          (payload) => {
            const row = payload.new as {
              id: string;
              croak: string;
              note_index: number;
              x: number;
              y: number;
              created_at: string;
            };
            setPads((current) =>
              current.some((pad) => pad.id === row.id)
                ? current
                : [
                    ...current,
                    {
                      id: row.id,
                      croak: row.croak,
                      note: row.note_index,
                      x: row.x,
                      y: row.y,
                      at: row.created_at,
                    },
                  ],
            );
            setFreshIds((ids) => [...ids, row.id]);
          },
        )
        .subscribe();
      cleanup = () => {
        void supabase.removeChannel(channel);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [loaded, day]);

  useEffect(() => () => songRef.current?.stop(), []);

  const notes = useMemo(() => pads.map((pad) => pad.note), [pads]);

  const plant = useCallback(
    async (x: number, y: number) => {
      if (planted || pending) return;
      setPending(true);
      setMessage(null);
      const result = await plantPondPad({
        data: { croak: croak.word, x, y, planter: planterId() },
      }).catch(() => null);
      setPending(false);
      if (!result) {
        setMessage("The pond did not hear that. Try once more.");
        return;
      }
      setPads(result.state.pads);
      if (result.ok) {
        setPlanted(true);
        playPadNote(croak.note);
        try {
          window.localStorage.setItem(`${PLANTED_PREFIX}${result.state.day}`, "1");
        } catch {
          /* nothing to remember locally — the server still knows */
        }
        discover("chorus");
        setMessage(`Your "${croak.word}" is in today's song.`);
        return;
      }
      if (result.reason === "already-planted") {
        setPlanted(true);
        setMessage("One pad per day — yours is already floating out there.");
      } else if (result.reason === "pond-busy") {
        setMessage("Today's pond is full. Wild. Come back tomorrow.");
      } else {
        setMessage("That croak is not in the pond's vocabulary.");
      }
    },
    [croak, planted, pending],
  );

  const onWaterClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const box = waterRef.current?.getBoundingClientRect();
      if (!box) return;
      const x = ((event.clientX - box.left) / box.width) * 100;
      const y = ((event.clientY - box.top) / box.height) * 100;
      void plant(x, y);
    },
    [plant],
  );

  const toggleSong = useCallback(() => {
    if (playing) {
      songRef.current?.stop();
      songRef.current = null;
      setPlaying(false);
      return;
    }
    if (notes.length === 0) return;
    setPlaying(true);
    discover("conductor");
    songRef.current = playPondSong(
      notes,
      (index) => setActiveIndex(index),
      () => {
        songRef.current = null;
        setPlaying(false);
        setActiveIndex(-1);
      },
    );
  }, [notes, playing]);

  const tally = pads.length;

  return (
    <Section
      id="chorus-pond"
      eyebrow="The chorus pond"
      title="Every day the pond writes one song. You are a note in it."
      intro="Pick a croak, drop it in the water, and it becomes a note in Ivy's theme — played in the order people arrived. One pad per visitor per day. At midnight UTC the pond empties and a brand new song begins from silence."
      tone="leaf"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* The water */}
        <div className="relative overflow-hidden rounded-3xl border-4 border-ivy bg-ivy p-3 pop-static">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
            <p className="font-display text-[0.7rem] tracking-[0.18em] text-cream/80 uppercase">
              Song of {day}
            </p>
            <p className="font-display text-[0.7rem] tracking-[0.18em] text-cream/80 uppercase tabular-nums">
              {tally} {tally === 1 ? "note" : "notes"} · resets in {formatLeft(left)}
            </p>
          </div>

          <button
            ref={waterRef}
            type="button"
            onClick={onWaterClick}
            disabled={planted || pending || !loaded}
            aria-label={
              planted
                ? "You have already planted today's lily pad"
                : `Plant your "${croak.word}" lily pad — tap anywhere in the water`
            }
            className="pond-water relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border-2 border-frog/40 disabled:cursor-default"
          >
            {pads.map((pad, index) => {
              const info = croakByNote(pad.note);
              const active = index === activeIndex;
              const fresh = freshIds.includes(pad.id);
              return (
                <span
                  key={pad.id}
                  className={`pond-pad ${fresh ? "pond-pad-fresh" : ""} ${active ? "pond-pad-active" : ""}`}
                  style={{
                    left: `${pad.x}%`,
                    top: `${pad.y}%`,
                    // Higher croaks float paler and smaller, like distance.
                    ["--pad-scale" as string]: `${1.15 - (pad.note / 33) * 0.4}`,
                    ["--pad-delay" as string]: `${(index % 12) * 0.18}s`,
                  }}
                  title={`${info.glyph} ${pad.croak} — ${info.meaning}`}
                >
                  <span aria-hidden>{info.glyph}</span>
                </span>
              );
            })}

            {loaded && tally === 0 ? (
              <span className="absolute inset-0 flex items-center justify-center px-6 text-center font-display text-cream/80">
                Silent pond. Nobody has croaked today yet — plant the first note.
              </span>
            ) : null}
          </button>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSong}
              disabled={tally === 0}
              className="pop inline-flex min-h-11 items-center gap-2 rounded-full bg-frog px-5 font-display text-charcoal disabled:opacity-50"
            >
              <FrogDoodle className="h-5 w-6 text-ivy" />
              {playing ? "Stop the chorus" : "Play today's chorus"}
            </button>
            <p className="text-sm text-cream/85">
              {playing
                ? "Listening to the pond in arrival order."
                : "Every pad is one note. More people, longer song."}
            </p>
          </div>
        </div>

        {/* The croak picker */}
        <div className="rounded-3xl border-4 border-ivy bg-card p-5 pop-static">
          <p className="font-display text-lg leading-tight">
            {planted ? "Your note is in the water" : "Choose your croak"}
          </p>
          <p className="mt-1 text-sm opacity-85">
            {planted
              ? "Come back after midnight UTC for a brand new empty pond and a brand new song."
              : "Each croak is a real note in Ivy's theme. Pick one, then tap anywhere in the pond to place it."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Croak vocabulary">
            {CROAKS.map((option) => {
              const selected = option.word === croak.word;
              return (
                <button
                  key={option.word}
                  type="button"
                  disabled={planted}
                  onClick={() => {
                    setCroak(option);
                    playPadNote(option.note);
                  }}
                  aria-pressed={selected}
                  className={`pop inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 font-display text-sm ${
                    selected
                      ? "border-ivy bg-frog text-charcoal"
                      : "border-ivy/30 bg-leaf/50 text-charcoal"
                  } disabled:opacity-60`}
                >
                  <span aria-hidden>{option.glyph}</span>
                  {option.word}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Sticker tone="lavender">{croak.glyph} {croak.word}</Sticker>
            <span className="text-sm opacity-80">{croak.meaning}</span>
          </div>

          {!planted ? (
            <button
              type="button"
              disabled={pending || !loaded}
              onClick={() => void plant(8 + Math.random() * 84, 14 + Math.random() * 72)}
              className="pop mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pink px-5 font-display text-charcoal disabled:opacity-60"
            >
              {pending ? "Planting…" : "Let the pond place it for me"}
            </button>
          ) : null}

          <p className="mt-3 min-h-5 text-sm font-display" aria-live="polite">
            {message}
          </p>
          <p className="mt-1 text-xs opacity-70">
            Nothing personal is stored — a pad only knows its croak and where it floats.
          </p>
        </div>
      </div>
    </Section>
  );
}
