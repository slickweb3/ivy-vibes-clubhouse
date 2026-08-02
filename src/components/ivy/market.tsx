/**
 * $ivy live market board.
 *
 * Honest by construction: every figure comes from Dexscreener for the exact
 * mint stored in the clubhouse database. Until a contract address exists,
 * everything renders "Coming Soon" and no chart is loaded. The chart iframe
 * is third-party, so it stays behind the cookie/embed consent gate.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ComingSoonPill, Section, StatusChip, keepTickerCase } from "@/components/ivy/primitives";
import { useEmbedConsent } from "@/components/ivy/cookie-consent";
import { CountUp } from "@/components/ivy/count-up";
import type { MarketSnapshot } from "@/lib/market.server";

function usd(value: number | null, digits = 2): string | null {
  if (value === null) return null;
  if (value !== 0 && Math.abs(value) < 0.01) {
    return `$${value.toPrecision(3)}`;
  }
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function compactUsd(value: number | null): string | null {
  if (value === null) return null;
  return `$${value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}`;
}

const STATUS_LABEL: Record<
  MarketSnapshot["status"],
  { status: "ok" | "pending" | "off"; label: string }
> = {
  live: { status: "ok", label: "Live market data" },
  awaiting_contract: { status: "pending", label: "Not launched yet" },
  awaiting_pair: { status: "pending", label: "Waiting for the first pair" },
  unavailable: { status: "pending", label: "Data provider unreachable" },
  disabled: { status: "off", label: "Live data paused" },
};

function Stat({
  label,
  value,
  amount,
  format,
}: {
  label: string;
  value: string | null;
  /** When present, the figure counts up on first view. */
  amount?: number | null;
  format?: (value: number) => string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 pop-static">
      <p className="font-display text-[0.7rem] tracking-wide text-charcoal/70 uppercase">
        {keepTickerCase(label)}
      </p>
      <div className="mt-2 font-display text-xl text-charcoal sm:text-2xl">
        {value === null ? (
          <ComingSoonPill />
        ) : amount !== null && amount !== undefined && format ? (
          <CountUp value={amount} format={format} />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

/** Dexscreener-style live board: a compact, brand-native read of the pair. */
function DexPanel({ snapshot }: { snapshot: MarketSnapshot }) {
  const c = snapshot.priceChanges;
  const windows: { label: string; value: number | null }[] = [
    { label: "5m", value: c?.m5 ?? null },
    { label: "1h", value: c?.h1 ?? null },
    { label: "6h", value: c?.h6 ?? null },
    { label: "24h", value: c?.h24 ?? null },
  ];
  const buys = snapshot.txns24h?.buys ?? 0;
  const sells = snapshot.txns24h?.sells ?? 0;
  const total = buys + sells;
  const buyPct = total > 0 ? (buys / total) * 100 : 50;

  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-card pop-static">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal/10 px-4 py-3">
        <p className="font-display text-base text-charcoal">
          <span className="lowercase">ivy</span> / SOL
        </p>
        <p className="text-xs text-charcoal/70">
          {snapshot.config.blockchain ?? "Solana"}
          {snapshot.dexId ? ` · ${snapshot.dexId}` : ""}
          {snapshot.config.launchPlatform ? ` via ${snapshot.config.launchPlatform}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-charcoal/10 sm:grid-cols-4">
        {[
          { label: "Price USD", value: usd(snapshot.priceUsd, 8) },
          { label: "Liquidity", value: compactUsd(snapshot.liquidityUsd) },
          { label: "FDV", value: compactUsd(snapshot.fdvUsd) },
          { label: "Market cap", value: compactUsd(snapshot.marketCapUsd ?? snapshot.fdvUsd) },
        ].map((cell) => (
          <div key={cell.label} className="bg-card px-4 py-3">
            <p className="font-display text-[0.65rem] tracking-wide text-charcoal/60 uppercase">
              {cell.label}
            </p>
            <p className="mt-1 font-display text-base text-charcoal sm:text-lg">
              {cell.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-px bg-charcoal/10">
        {windows.map((w) => (
          <div key={w.label} className="bg-card px-2 py-3 text-center">
            <p className="font-display text-[0.65rem] tracking-wide text-charcoal/60 uppercase">
              {w.label}
            </p>
            <p
              className={`mt-1 font-display text-sm ${
                w.value === null
                  ? "text-charcoal/50"
                  : w.value > 0
                    ? "text-deep-ivy"
                    : w.value < 0
                      ? "text-berry"
                      : "text-charcoal/70"
              }`}
            >
              {w.value === null ? "—" : `${w.value > 0 ? "+" : ""}${w.value.toFixed(2)}%`}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between font-display text-xs text-charcoal/80">
          <span>{buys.toLocaleString()} buys</span>
          <span className="text-charcoal/60">
            {total.toLocaleString()} txns · 24h vol {compactUsd(snapshot.volume24hUsd) ?? "—"}
          </span>
          <span>{sells.toLocaleString()} sells</span>
        </div>
        <div
          className="flex h-2 overflow-hidden rounded-full bg-charcoal/10"
          role="img"
          aria-label={`${buys} buys versus ${sells} sells in the last 24 hours`}
        >
          <span className="bg-frog" style={{ width: `${buyPct}%` }} />
          <span className="flex-1 bg-pink" />
        </div>
      </div>
    </div>
  );
}

export function LiveMarket({ snapshot }: { snapshot: MarketSnapshot }) {
  const [fetchedLabel, setFetchedLabel] = useState<string | null>(null);
  const chip = STATUS_LABEL[snapshot.status];
  const live = snapshot.status === "live";

  useEffect(() => {
    setFetchedLabel(new Date(snapshot.fetchedAt).toLocaleTimeString());
  }, [snapshot.fetchedAt]);



  return (
    <Section
      id="live-chart"
      eyebrow="Chart & market"
      title="The $ivy tracker"
      intro="This board reads straight from the on-chain pair — price, market cap, liquidity and volume. Nothing here is guessed."

      tone="white"
    >
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip status={chip.status} label={chip.label} />
        {live && fetchedLabel ? (
          <span className="text-xs text-charcoal/70">Updated {fetchedLabel} · Dexscreener</span>
        ) : null}
      </div>

      {snapshot.message ? (
        <p className="mt-4 max-w-3xl rounded-2xl bg-yellow p-4 text-sm leading-relaxed text-charcoal/90 pop-static">
          {snapshot.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Price"
          value={live ? usd(snapshot.priceUsd, 6) : null}
          amount={live ? snapshot.priceUsd : null}
          format={(n) => usd(n, 6) ?? ""}
        />
        <Stat
          label="Market cap"
          value={live ? compactUsd(snapshot.marketCapUsd ?? snapshot.fdvUsd) : null}
          amount={live ? (snapshot.marketCapUsd ?? snapshot.fdvUsd) : null}
          format={(n) => compactUsd(n) ?? ""}
        />
        <Stat
          label="Liquidity"
          value={live ? compactUsd(snapshot.liquidityUsd) : null}
          amount={live ? snapshot.liquidityUsd : null}
          format={(n) => compactUsd(n) ?? ""}
        />
        <Stat
          label="24h volume"
          value={live ? compactUsd(snapshot.volume24hUsd) : null}
          amount={live ? snapshot.volume24hUsd : null}
          format={(n) => compactUsd(n) ?? ""}
        />
      </div>

      {live ? <DexPanel snapshot={snapshot} /> : null}

      {/* Always-open live chart */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-card p-4 pop-static">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg text-charcoal">Live price chart</h3>
          {snapshot.pairUrl ? (
            <a
              href={snapshot.pairUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center rounded-full bg-lavender px-4 font-display text-xs text-charcoal pop"
            >
              Open on Dexscreener ↗
            </a>
          ) : null}
        </div>
        {snapshot.chartEmbedUrl ? (
          <div className="mt-3 aspect-[3/4] w-full overflow-hidden rounded-xl sm:aspect-[16/9]">
            <iframe
              src={snapshot.chartEmbedUrl}
              title="$ivy live price chart on Dexscreener"
              className="h-full w-full border-0"
              allow="clipboard-write"
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-charcoal/80">
            The chart appears automatically the moment the official pair is trading.
          </p>
        )}
      </div>


      <p className="mt-5 rounded-xl bg-pink p-4 font-display text-sm text-charcoal pop-static">
        Market data is informational only, not financial advice. Always verify the mint address on
        this page before trading anything called $ivy.
      </p>
    </Section>
  );
}
