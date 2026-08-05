/**
 * $ivy on-chain intel board — holder count with timeframe deltas plus the
 * market-shape numbers that actually tell you something about a meme coin.
 *
 * Every figure is read from the Solana RPC for the published mint, from
 * Dexscreener, or from our own recorded snapshots. Missing data renders "—"
 * and history that does not exist yet says so plainly.
 */
import type { TokenIntel } from "@/lib/token-intel.server";

function pct(value: number | null, digits = 1): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

function compactUsd(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}`;
}

function toneClass(value: number | null): string {
  if (value === null || value === 0) return "text-charcoal/70";
  return value > 0 ? "text-ivy" : "text-berry";
}

function signed(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US")}`;
}

function Cell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="font-display text-[0.65rem] tracking-wide text-charcoal/60 uppercase">
        {label}
      </p>
      <p className="mt-1 font-display text-base text-charcoal sm:text-lg">{value}</p>
      {hint ? <p className="mt-0.5 text-[0.7rem] leading-snug text-charcoal/65">{hint}</p> : null}
    </div>
  );
}

export function TokenIntelPanel({ intel }: { intel: TokenIntel }) {
  const hasHolders = intel.holders !== null;
  const anyHistory = intel.holderDeltas.some((d) => d.from !== null);

  return (
    <div className="mt-8 overflow-hidden rounded-3xl bg-card pop-static">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal/10 px-4 py-3">
        <h3 className="font-display text-lg text-charcoal">Holders &amp; on-chain health</h3>
        <p className="text-xs text-charcoal/70">
          {hasHolders ? "Solana RPC · refreshed every 5 min" : "Waiting on chain data"}
        </p>
      </div>

      {intel.message ? (
        <p className="px-4 py-4 text-sm leading-relaxed text-charcoal/85">{intel.message}</p>
      ) : null}

      {hasHolders ? (
        <>
          <div className="grid grid-cols-2 gap-px bg-charcoal/10 sm:grid-cols-4">
            <Cell
              label="Holders"
              value={intel.holders!.toLocaleString("en-US")}
              hint="Wallets with a non-zero $ivy balance"
            />
            <Cell
              label="Token accounts"
              value={(intel.holderAccounts ?? 0).toLocaleString("en-US")}
              hint="Includes wallets that have sold out"
            />
            <Cell
              label="Peak holders"
              value={(intel.recordedPeakHolders ?? intel.holders!).toLocaleString("en-US")}
              hint="Highest we have recorded on this site"
            />
            <Cell
              label="Token accounts"
              value={(intel.holderAccounts ?? 0).toLocaleString("en-US")}
              hint="Includes wallets that have sold out"
            />
          </div>

          {/* Timeframe holder movement */}
          <div className="border-t border-charcoal/10 px-4 pt-4">
            <p className="font-display text-sm text-charcoal">Holder change by timeframe</p>
            <p className="mt-0.5 text-[0.75rem] text-charcoal/65">
              {anyHistory
                ? "Compared against our own recorded snapshots — no estimates."
                : "Tracking just started, so longer windows fill in as snapshots are recorded."}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-px bg-charcoal/10">
            {intel.holderDeltas.map((delta) => (
              <div key={delta.key} className="bg-card px-1 py-3 text-center">
                <p className="font-display text-[0.65rem] tracking-wide text-charcoal/60 uppercase">
                  {delta.label}
                </p>
                <p className={`mt-1 font-display text-sm ${toneClass(delta.percent)}`}>
                  {delta.percent === null
                    ? "—"
                    : `${delta.percent > 0 ? "+" : ""}${delta.percent.toFixed(1)}%`}
                </p>
                <p className="text-[0.7rem] text-charcoal/65">{signed(delta.change)}</p>
                {delta.partial && delta.agedHours !== null ? (
                  <p className="text-[0.6rem] leading-tight text-charcoal/55">
                    {delta.agedHours < 24
                      ? `only ${Math.round(delta.agedHours)}h tracked`
                      : `only ${Math.round(delta.agedHours / 24)}d tracked`}
                  </p>
                ) : null}
              </div>
            ))}
          </div>


          <div className="mt-px grid grid-cols-2 gap-px bg-charcoal/10 sm:grid-cols-4">
            <Cell
              label="Liquidity depth"
              value={pct(intel.liquidityToMcapPercent)}
              hint="Pool liquidity vs market cap"
            />
            <Cell
              label="24h turnover"
              value={pct(intel.turnover24hPercent)}
              hint="Volume traded vs market cap"
            />
            <Cell
              label="Buy pressure"
              value={pct(intel.buyPressurePercent)}
              hint="Share of 24h trades that were buys"
            />
            <Cell
              label="Avg trade"
              value={compactUsd(intel.avgTradeUsd)}
              hint="24h volume ÷ 24h trades"
            />
            <Cell
              label="Volume / holder"
              value={compactUsd(intel.volumePerHolderUsd)}
              hint="How actively holders traded today"
            />
            <Cell
              label="Market cap / holder"
              value={compactUsd(intel.mcapPerHolderUsd)}
              hint="Average value held per wallet"
            />
            <Cell
              label="Mint authority"
              value={
                intel.mintAuthorityRevoked === null
                  ? "—"
                  : intel.mintAuthorityRevoked
                    ? "Revoked"
                    : "Active"
              }
              hint="Revoked means no new supply can be minted"
            />
            <Cell
              label="Freeze authority"
              value={
                intel.freezeAuthorityRevoked === null
                  ? "—"
                  : intel.freezeAuthorityRevoked
                    ? "Revoked"
                    : "Active"
              }
              hint="Revoked means wallets cannot be frozen"
            />
          </div>

          <p className="px-4 py-3 text-[0.75rem] leading-relaxed text-charcoal/70">
            Holder counts include liquidity pools and exchange accounts, so treat “top 10 hold” as a
            shape, not a verdict. Snapshots are recorded every 15 minutes
            {intel.trackingSince
              ? ` (history since ${new Date(intel.trackingSince).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })})`
              : ""}
            .
          </p>
        </>
      ) : null}
    </div>
  );
}
