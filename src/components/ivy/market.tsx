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

const STATUS_LABEL: Record<MarketSnapshot["status"], { status: "ok" | "pending" | "off"; label: string }> = {
  live: { status: "ok", label: "Live market data" },
  awaiting_contract: { status: "pending", label: "Not launched yet" },
  awaiting_pair: { status: "pending", label: "Waiting for the first pair" },
  unavailable: { status: "pending", label: "Data provider unreachable" },
  disabled: { status: "off", label: "Live data paused" },
};

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-card p-4 pop-static">
      <p className="font-display text-[0.7rem] tracking-wide text-charcoal/70 uppercase">{keepTickerCase(label)}</p>
      <div className="mt-2 font-display text-xl text-charcoal sm:text-2xl">
        {value ?? <ComingSoonPill />}
      </div>
    </div>
  );
}

export function LiveMarket({ snapshot }: { snapshot: MarketSnapshot }) {
  const { embedsAllowed, openSettings } = useEmbedConsent();
  const [chartOn, setChartOn] = useState(false);
  const [fetchedLabel, setFetchedLabel] = useState<string | null>(null);
  const chip = STATUS_LABEL[snapshot.status];
  const live = snapshot.status === "live";

  useEffect(() => {
    setFetchedLabel(new Date(snapshot.fetchedAt).toLocaleTimeString());
  }, [snapshot.fetchedAt]);

  const change = snapshot.priceChange24h;

  return (
    <Section
      id="live-chart"
      eyebrow="Chart & market"
      title="The $ivy tracker"
      intro="When the coin exists, this board reads straight from the on-chain pair — price, market cap, liquidity and volume. Until then, nothing here is guessed."
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
        <Stat label="Price" value={live ? usd(snapshot.priceUsd, 6) : null} />
        <Stat label="Market cap" value={live ? compactUsd(snapshot.marketCapUsd ?? snapshot.fdvUsd) : null} />
        <Stat label="Liquidity" value={live ? compactUsd(snapshot.liquidityUsd) : null} />
        <Stat label="24h volume" value={live ? compactUsd(snapshot.volume24hUsd) : null} />
      </div>

      {live ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {change !== null ? (
            <span
              className={`inline-flex min-h-9 items-center rounded-full px-3 font-display text-sm pop-static ${
                change >= 0 ? "bg-frog text-charcoal" : "bg-pink text-charcoal"
              }`}
            >
              {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% (24h)
            </span>
          ) : null}
          {snapshot.txns24h ? (
            <span className="text-sm text-charcoal/80">
              {snapshot.txns24h.buys.toLocaleString()} buys · {snapshot.txns24h.sells.toLocaleString()} sells (24h)
            </span>
          ) : null}
          {snapshot.dexId ? (
            <span className="text-sm text-charcoal/70">Pair on {snapshot.dexId}</span>
          ) : null}
        </div>
      ) : null}

      {/* Consent-gated third-party chart */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-card p-4 pop-static">
        <h3 className="font-display text-lg text-charcoal">Price chart</h3>
        {!snapshot.chartEmbedUrl ? (
          <p className="mt-2 text-sm text-charcoal/80">
            The chart appears automatically the moment the official pair is trading.
          </p>
        ) : !embedsAllowed ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-charcoal/80">
              The chart is loaded from Dexscreener. Nothing third-party loads until you allow it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={openSettings}
                className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
              >
                Allow embeds
              </Button>
              {snapshot.pairUrl ? (
                <a
                  href={snapshot.pairUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full bg-yellow px-5 font-display text-sm text-charcoal pop"
                >
                  Open chart on Dexscreener
                </a>
              ) : null}
            </div>
          </div>
        ) : !chartOn ? (
          <div className="mt-3">
            <Button
              onClick={() => setChartOn(true)}
              className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
            >
              Load the live chart
            </Button>
          </div>
        ) : (
          <div className="mt-3 aspect-[4/5] w-full overflow-hidden rounded-xl sm:aspect-[16/9]">
            <iframe
              src={snapshot.chartEmbedUrl}
              title="$ivy live price chart on Dexscreener"
              loading="lazy"
              className="h-full w-full border-0"
              allow="clipboard-write"
            />
          </div>
        )}
      </div>

      <p className="mt-5 rounded-xl bg-pink p-4 font-display text-sm text-charcoal pop-static">
        Market data is informational only, not financial advice. Always verify the mint address on
        this page before trading anything called $ivy.
      </p>
    </Section>
  );
}
