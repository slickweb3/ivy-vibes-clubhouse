/**
 * Season card for a connected wallet.
 *
 * Everything here is read-only: the wallet address is the only thing we ever
 * read from the wallet, and the stats come back from a public, masked-board
 * lookup keyed by that address. No transactions, no approvals, no signatures.
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPlayerCard } from "@/lib/game.functions";
import type { PlayerCard } from "@/lib/game.server";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border-2 border-charcoal/15 bg-background px-3 py-2">
      <p className="font-display text-lg leading-tight text-charcoal tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-charcoal/65">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-charcoal/60">{hint}</p> : null}
    </div>
  );
}

export function SeasonCard({
  wallet,
  refreshKey,
}: {
  wallet: string;
  /** Bump to refetch after a score lands. */
  refreshKey: number;
}) {
  const fetchCard = useServerFn(getPlayerCard);
  const [card, setCard] = useState<PlayerCard | null>(null);

  useEffect(() => {
    let live = true;
    fetchCard({ data: { wallet } })
      .then((next) => {
        if (live) setCard(next);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [fetchCard, wallet, refreshKey]);

  if (!card) return null;

  const progress =
    card.xpForNextLevel > 0
      ? Math.max(0, Math.min(100, Math.round((card.xpIntoLevel / card.xpForNextLevel) * 100)))
      : 0;

  return (
    <section
      aria-label="Your season card"
      className="mt-4 rounded-2xl border-[3px] border-charcoal bg-leaf p-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg text-charcoal">
            Level {card.level} · {card.seasonLabel}
          </h3>
          <p className="text-xs text-charcoal/75">
            {card.rank ? `Ranked #${card.rank} this season` : "Post a run to enter this season"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold text-charcoal pop-static ${
            card.rewardEligible ? "bg-frog" : "bg-pink"
          }`}
        >
          {card.rewardEligible ? "Reward eligible" : "Under review"}
        </span>
      </div>

      <div className="mt-3">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to level ${card.level + 1}`}
          className="h-3 w-full overflow-hidden rounded-full border-2 border-charcoal bg-cream"
        >
          <div
            className="h-full bg-frog transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-charcoal/70">
          {card.xpIntoLevel}/{card.xpForNextLevel} XP to level {card.level + 1}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Season best" value={card.bestScore.toLocaleString("en-US")} />
        <Stat label="Runs" value={card.plays.toLocaleString("en-US")} />
        <Stat
          label="Day streak"
          value={String(card.streakDays)}
          hint={card.bestStreakDays > card.streakDays ? `Best ${card.bestStreakDays}` : undefined}
        />
        <Stat label="Fair play" value={`${card.fairPlay}%`} />
        <Stat label="Coins scooped" value={card.coins.toLocaleString("en-US")} />
        <Stat label="Active days" value={String(card.activeDays)} />
        <Stat label="Seasons played" value={String(card.seasonsPlayed)} />
        <Stat label="All-time best" value={card.lifetimeBest.toLocaleString("en-US")} />
      </div>

      <p className="mt-3 text-[11px] text-charcoal/70">
        We read your public address and nothing else. XP, streaks and fair-play are earned by
        playing — they can never be bought.
      </p>
    </section>
  );
}
