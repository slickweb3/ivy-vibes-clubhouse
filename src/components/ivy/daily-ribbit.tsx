import { useCallback, useEffect, useMemo, useState } from "react";
import { Section, Sticker } from "@/components/ivy/primitives";
import { FrogDoodle, PawDoodle } from "@/components/ivy/doodles";
import oracleSticker from "@/assets/ivy-oracle-sticker.jpg.asset.json";
import { discover } from "@/lib/discoveries";
import {
  msUntilTomorrow,
  openRibbit,
  readRibbitState,
  recentDays,
  ribbitForDay,
  todayKey,
  type RibbitState,
} from "@/lib/daily-ribbit";

/**
 * Ivy's Daily Ribbit — one reading per day, one stamp per visit.
 *
 * The reason to come back tomorrow: the pond only speaks once a day, the
 * same reading for everybody, and your streak of stamps lives on this device.
 */

const EMPTY: RibbitState = { days: [], streak: 0, longestStreak: 0, todayOpened: false };

function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${`${m}`.padStart(2, "0")}m ${`${s}`.padStart(2, "0")}s`;
}

export function DailyRibbit() {
  const [state, setState] = useState<RibbitState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const day = todayKey();
  const reading = useMemo(() => ribbitForDay(day), [day]);
  const days = useMemo(() => recentDays(14), []);

  useEffect(() => {
    const next = readRibbitState();
    setState(next);
    setRevealed(next.todayOpened);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!revealed) return undefined;
    setCountdown(msUntilTomorrow());
    const timer = window.setInterval(() => setCountdown(msUntilTomorrow()), 1000);
    return () => window.clearInterval(timer);
  }, [revealed]);

  const open = useCallback(() => {
    const next = openRibbit();
    setState(next);
    setRevealed(true);
    discover("oracle");
    if (next.streak >= 3) discover("streak");
  }, []);

  return (
    <Section
      id="daily-ribbit"
      eyebrow="Ivy's daily ribbit"
      title="The pond speaks once a day"
      intro="One reading, one stamp, every day — the same ribbit for everybody in the pond. Your streak is kept on this device only, so nothing is sent anywhere."
      tone="lavender"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-3xl border-4 border-ivy bg-card p-5 pop-static">
          <div className="flex items-start gap-4">
            <img
              src={oracleSticker.url}
              alt="Ivy the Frog Queen sitting in the grass, tongue out, mid-ribbit"
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="h-24 w-24 shrink-0 rounded-2xl object-cover float-slow"
            />
            <div className="min-w-0">
              <p className="font-display text-[0.7rem] tracking-[0.18em] uppercase opacity-60">
                {day}
              </p>
              {hydrated && revealed ? (
                <>
                  <p className="mt-1 flex items-center gap-2 font-display text-xl leading-tight">
                    <span aria-hidden>{reading.glyph}</span>
                    {reading.stamp}
                  </p>
                  <p className="mt-2 text-base leading-relaxed">{reading.reading}</p>
                  <p className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-ivy/40 bg-leaf/60 p-3 text-sm text-charcoal">
                    <PawDoodle className="mt-0.5 h-4 w-4 shrink-0 text-ivy" />
                    <span>
                      <span className="font-display">Today's small quest:</span> {reading.quest}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-display text-xl leading-tight">Today's ribbit is closed</p>
                  <p className="mt-2 text-base leading-relaxed opacity-85">
                    Tap the lily pad to hear what the pond has to say. Just for fun — never
                    financial advice.
                  </p>
                </>
              )}
            </div>
          </div>

          {hydrated && !revealed ? (
            <button
              type="button"
              onClick={open}
              className="pop mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-frog px-6 font-display text-charcoal"
            >
              <FrogDoodle className="h-5 w-6 text-ivy" />
              Open today's ribbit
            </button>
          ) : null}

          {hydrated && revealed ? (
            <p
              className="mt-5 rounded-full border-2 border-ivy/40 px-4 py-2 text-center text-sm tabular-nums"
              aria-live="off"
            >
              Next ribbit in {formatCountdown(countdown)}
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border-4 border-ivy bg-card p-5 pop-static">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg leading-tight">Your lily pond</p>
              <p className="text-sm opacity-80">Last fourteen days of stamps.</p>
            </div>
            <div className="flex gap-2">
              <Sticker tone="yellow">
                🔥 {hydrated ? state.streak : 0} day streak
              </Sticker>
              <Sticker tone="pink">Best {hydrated ? state.longestStreak : 0}</Sticker>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-7 gap-2">
            {days.map((key) => {
              const got = hydrated && state.days.includes(key);
              const isToday = key === day;
              const stamp = ribbitForDay(key);
              const label = `${key}${got ? ` — ${stamp.stamp}` : " — no stamp"}`;
              return (
                <li key={key}>
                  <div
                    title={label}
                    aria-label={label}
                    className={
                      got
                        ? "flex aspect-square items-center justify-center rounded-2xl border-2 border-ivy bg-leaf text-lg text-charcoal"
                        : isToday
                          ? "flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-ivy/70 text-lg opacity-70"
                          : "flex aspect-square items-center justify-center rounded-2xl border-2 border-ivy/25 text-lg opacity-40"
                    }
                  >
                    <span aria-hidden>{got ? stamp.glyph : isToday ? "🪷" : "·"}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-sm opacity-80">
            {hydrated && state.streak >= 3
              ? "Ivy has started expecting you. Keep the streak alive."
              : "Come back tomorrow for a new reading and a new stamp."}
          </p>
        </div>
      </div>
    </Section>
  );
}
