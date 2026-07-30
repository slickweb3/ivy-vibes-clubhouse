/**
 * Small live $ivy view: a first-party sparkline + price chip.
 *
 * Honesty rules:
 * - No third-party code loads here. The shape is drawn from Dexscreener's own
 *   24h / 6h / 1h / 5m percentage changes for the exact mint in the database,
 *   so it is a real (if coarse) 24h trend, and it is labelled as such.
 * - Before launch there is no data, so the card says so instead of guessing.
 */
import { Link } from "@tanstack/react-router";
import type { MarketSnapshot } from "@/lib/market.server";

function money(value: number | null): string | null {
  if (value === null) return null;
  if (value !== 0 && Math.abs(value) < 0.01) return `$${value.toPrecision(3)}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function compact(value: number | null): string | null {
  if (value === null) return null;
  return `$${value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}`;
}

/**
 * Rebuild approximate past prices from the % change windows.
 * price(t ago) = current / (1 + change/100)
 */
function sparkPoints(snapshot: MarketSnapshot): number[] | null {
  const now = snapshot.priceUsd;
  const c = snapshot.priceChanges;
  if (now === null || !c) return null;
  const back = (pct: number | null) =>
    pct === null || 1 + pct / 100 <= 0 ? null : now / (1 + pct / 100);
  const series = [back(c.h24), back(c.h6), back(c.h1), back(c.m5), now].filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  return series.length >= 3 ? series : null;
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 220;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || max || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - 4 - ((p - min) / span) * (h - 12);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const stroke = up ? "var(--color-deep-ivy, #174F36)" : "#B3315A";
  const fill = up ? "#83D94E" : "#FF8EAE";
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full"
      role="img"
      aria-label={`24 hour $ivy price trend, ${up ? "up" : "down"}`}
      preserveAspectRatio="none"
    >
      <path d={area} fill={fill} fillOpacity="0.35" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill={stroke} />
    </svg>
  );
}

export function MiniChart({ snapshot }: { snapshot: MarketSnapshot }) {
  const live = snapshot.status === "live";
  const change = snapshot.priceChange24h;
  const up = (change ?? 0) >= 0;
  const points = live ? sparkPoints(snapshot) : null;

  return (
    <div className="rounded-3xl bg-card p-4 pop-static sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-[0.7rem] tracking-wide text-charcoal/70 uppercase">
          <span className="lowercase">$ivy</span> · live view
        </p>
        {live && change !== null ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 font-display text-xs text-charcoal ${
              up ? "bg-frog" : "bg-pink"
            }`}
          >
            {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% 24h
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow px-2.5 py-1 font-display text-xs text-charcoal">
            Not launched yet
          </span>
        )}
      </div>

      {live ? (
        <>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-2xl text-charcoal">{money(snapshot.priceUsd) ?? "—"}</span>
            {compact(snapshot.marketCapUsd ?? snapshot.fdvUsd) ? (
              <span className="text-xs text-charcoal/70">
                MC {compact(snapshot.marketCapUsd ?? snapshot.fdvUsd)}
              </span>
            ) : null}
          </div>
          {points ? (
            <div className="mt-2">
              <Sparkline points={points} up={up} />
              <p className="mt-1 text-[0.65rem] text-charcoal/60">
                24h trend from Dexscreener change windows · not a candle chart
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-charcoal/70">Trend data arrives with the first trades.</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
          The moment the official mint is published, the price, market cap and trend line light up here.
          Nothing is guessed before then.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/"
          hash="live-chart"
          className="inline-flex min-h-9 items-center rounded-full bg-frog px-4 font-display text-xs text-charcoal pop"
        >
          Full chart
        </Link>
        {snapshot.pairUrl ? (
          <a
            href={snapshot.pairUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center rounded-full bg-lavender px-4 font-display text-xs text-charcoal pop"
          >
            Dexscreener ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}
