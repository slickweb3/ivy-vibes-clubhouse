/**
 * The pulse strip: the first thing under the hero.
 *
 * It exists to answer "is this real and is it alive?" in one glance — live
 * price, 24h move, holders, market cap, liquidity and the two safety flags —
 * with a straight path to the buy walkthrough.
 *
 * Honesty rules: every figure is passed in from the live snapshot. Anything
 * missing renders as "—" and the safety flags only claim "Revoked" when the
 * chain scan actually says so.
 */
import { Link } from "@tanstack/react-router";
import type { MarketSnapshot } from "@/lib/market.server";
import type { TokenIntel } from "@/lib/token-intel.server";
import { scrollToSection } from "@/lib/scroll-to-section";

function price(value: number | null): string {
  if (value === null) return "—";
  if (value !== 0 && Math.abs(value) < 0.01) return `$${value.toPrecision(3)}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function compact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}`;
}

function count(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US");
}

function Cell({
  label,
  value,
  hint,
  tone = "text-cream",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5">
      <p className="font-display text-[0.6rem] tracking-[0.14em] text-cream/60 uppercase">
        {label}
      </p>
      <p className={`mt-1 truncate font-display text-lg leading-tight sm:text-xl ${tone}`}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[0.7rem] text-cream/55">{hint}</p> : null}
    </div>
  );
}

export function LivePulse({
  snapshot,
  intel,
}: {
  snapshot: MarketSnapshot | null;
  intel?: TokenIntel | null;
}) {
  const live = snapshot?.status === "live";
  const change = snapshot?.priceChange24h ?? null;
  const up = (change ?? 0) >= 0;
  const holders = intel?.holders ?? null;
  const mintRevoked = intel?.mintAuthorityRevoked === true;
  const freezeRevoked = intel?.freezeAuthorityRevoked === true;

  return (
    <section aria-label="Live $ivy pulse" className="relative bg-ivy">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${live ? "bg-frog pulse" : "bg-yellow"}`}
            />
            <p className="truncate font-display text-sm tracking-wide text-cream/85 uppercase">
              {live ? "Live on-chain right now" : "Waiting on live market data"}
            </p>
          </div>
          {live && change !== null ? (
            <span
              className={`shrink-0 rounded-full px-3 py-1 font-display text-xs text-charcoal ${
                up ? "bg-frog" : "bg-pink"
              }`}
            >
              {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% · 24h
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-cream/15 sm:grid-cols-3 lg:grid-cols-6">
          <div className="bg-ivy">
            <Cell
              label="Price"
              value={live ? price(snapshot?.priceUsd ?? null) : "—"}
              hint="USD per $ivy"
              tone="text-frog"
            />
          </div>
          <div className="bg-ivy">
            <Cell
              label="Market cap"
              value={live ? compact(snapshot?.marketCapUsd ?? snapshot?.fdvUsd ?? null) : "—"}
              hint="Fully diluted"
            />
          </div>
          <div className="bg-ivy">
            <Cell
              label="Liquidity"
              value={live ? compact(snapshot?.liquidityUsd ?? null) : "—"}
              hint="In the pool"
            />
          </div>
          <div className="bg-ivy">
            <Cell label="Holders" value={count(holders)} hint="Wallets holding $ivy" />
          </div>
          <div className="bg-ivy">
            <Cell
              label="Mint authority"
              value={mintRevoked ? "Revoked" : "—"}
              hint="No new supply can be minted"
              tone={mintRevoked ? "text-leaf" : "text-cream"}
            />
          </div>
          <div className="bg-ivy">
            <Cell
              label="Freeze authority"
              value={freezeRevoked ? "Revoked" : "—"}
              hint="Wallets cannot be frozen"
              tone={freezeRevoked ? "text-leaf" : "text-cream"}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => scrollToSection("how-to-buy")}
            className="inline-flex min-h-11 items-center rounded-full bg-frog px-5 font-display text-sm text-charcoal pop"
          >
            How to buy <span className="lowercase">$ivy</span>
          </button>
          <Link
            to="/"
            hash="live-chart"
            className="inline-flex min-h-11 items-center rounded-full bg-yellow px-5 font-display text-sm text-charcoal pop"
          >
            See the live chart
          </Link>
          <p className="text-xs text-cream/60">
            1,000,000,000 supply · 0% tax · fair launch on pump.fun
          </p>
        </div>
      </div>
    </section>
  );
}
