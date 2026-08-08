/**
 * Server-only on-chain intel reader for the $ivy mint.
 *
 * Truth rules (same as the market reader):
 * - Every number here is read from the Solana JSON-RPC for the exact mint in
 *   `project_config.contract_address`, or from our own recorded history.
 * - Nothing is estimated. If a call fails, the field stays null and the UI
 *   says so instead of inventing a figure.
 * - Holder history cannot be back-filled from anywhere, so we record our own
 *   snapshots in `token_metrics_snapshots` and compare against them.
 */
import { publicClient } from "@/lib/media-read.server";
import { readMarketSnapshot } from "@/lib/market.server";

// Public RPCs rate-limit heavy account scans, so we try several in order and
// keep the first one that answers. SOLANA_RPC_URL (a paid endpoint) wins when set.
const RPC_URLS = (): string[] => {
  const configured = process.env["SOLANA_RPC_URL"];
  return [
    ...(configured ? [configured] : []),
    "https://solana-rpc.publicnode.com",
    "https://api.mainnet-beta.solana.com",
  ];
};

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type TimeframeKey = "h1" | "h6" | "h24" | "d7" | "d30";

export interface HolderDelta {
  key: TimeframeKey;
  label: string;
  /** Holder count at the start of the window, from our recorded history. */
  from: number | null;
  change: number | null;
  percent: number | null;
  /** How old the compared snapshot actually is, in hours. */
  agedHours: number | null;
  /** True when history is younger than the window, so this covers less time. */
  partial: boolean;
}

export interface TokenIntel {
  status: "live" | "awaiting_contract" | "unavailable" | "disabled";
  mint: string | null;
  /** Wallets holding a non-zero balance right now. */
  holders: number | null;
  /** All token accounts for the mint, including emptied ones. */
  holderAccounts: number | null;
  holderDeltas: HolderDelta[];
  /** Share of supply held by the ten largest accounts (pools included). */
  top10Percent: number | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
  circulatingSupply: number | null;
  /** Market-shape ratios derived from live Dexscreener figures. */
  liquidityToMcapPercent: number | null;
  turnover24hPercent: number | null;
  buyPressurePercent: number | null;
  avgTradeUsd: number | null;
  volumePerHolderUsd: number | null;
  mcapPerHolderUsd: number | null;
  /** Best figures we have ever recorded ourselves (not an all-time chain ATH). */
  recordedPeakHolders: number | null;
  recordedPeakMarketCapUsd: number | null;
  historyPoints: number;
  trackingSince: string | null;
  fetchedAt: string;
  message: string | null;
}

const TIMEFRAMES: Array<{ key: TimeframeKey; label: string; hours: number }> = [
  { key: "h1", label: "1h", hours: 1 },
  { key: "h6", label: "6h", hours: 6 },
  { key: "h24", label: "24h", hours: 24 },
  { key: "d7", label: "7d", hours: 24 * 7 },
  { key: "d30", label: "30d", hours: 24 * 30 },
];

async function rpc<T>(method: string, params: unknown[]): Promise<T | null> {
  for (const url of RPC_URLS()) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(7_000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { result?: T; error?: unknown };
      if (json.error || json.result === undefined) continue;
      return json.result;
    } catch {
      continue;
    }
  }
  return null;
}

interface ProgramAccount {
  account: { data: [string, string] | { parsed?: unknown } };
}

/** Little-endian u64 amount out of a base64 8-byte slice. */
function readAmount(base64: string): number {
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  if (bytes.length < 8) return 0;
  let value = 0n;
  for (let i = 7; i >= 0; i -= 1) value = (value << 8n) | BigInt(bytes[i] ?? 0);
  return Number(value);
}

/**
 * Counts token accounts for the mint across both SPL token programs, slicing
 * only the 8 balance bytes so the response stays small.
 */
async function countHolders(mint: string): Promise<{
  holders: number;
  accounts: number;
  rawTotal: number;
  rawTop10: number;
} | null> {
  const results = await Promise.all(
    [TOKEN_PROGRAM, TOKEN_2022_PROGRAM].map((program) =>
      rpc<ProgramAccount[]>("getProgramAccounts", [
        program,
        {
          encoding: "base64",
          dataSlice: { offset: 64, length: 8 },
          filters: [{ memcmp: { offset: 0, bytes: mint } }],
        },
      ]),
    ),
  );

  if (results.every((r) => r === null)) return null;

  let holders = 0;
  let accounts = 0;
  const balances: number[] = [];
  for (const list of results) {
    if (!list) continue;
    for (const item of list) {
      accounts += 1;
      const data = item.account?.data;
      const raw = Array.isArray(data) ? data[0] : null;
      const amount = raw ? readAmount(raw) : 0;
      if (amount > 0) {
        holders += 1;
        balances.push(amount);
      }
    }
  }
  // Some public RPCs answer a mint-filtered scan with an empty list instead of
  // an error when the token program is excluded from their secondary indexes.
  // A live mint with real trading never has zero accounts, so treat that as
  // "blocked" rather than recording a false 0 (which would also produce a fake
  // -100% delta on every timeframe).
  if (accounts === 0 || holders === 0) return null;
  balances.sort((a, b) => b - a);
  const rawTotal = balances.reduce((sum, value) => sum + value, 0);
  const rawTop10 = balances.slice(0, 10).reduce((sum, value) => sum + value, 0);
  return { holders, accounts, rawTotal, rawTop10 };
}


interface MintAccountInfo {
  value?: {
    data?: {
      parsed?: {
        info?: {
          decimals?: number;
          mintAuthority?: string | null;
          freezeAuthority?: string | null;
        };
      };
    };
  };
}

async function readAuthorities(mint: string) {
  const info = await rpc<MintAccountInfo>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  const parsed = info?.value?.data?.parsed?.info;
  if (!parsed) return { mintAuthorityRevoked: null, freezeAuthorityRevoked: null, decimals: null };
  return {
    mintAuthorityRevoked: !parsed.mintAuthority,
    freezeAuthorityRevoked: !parsed.freezeAuthority,
    decimals: typeof parsed.decimals === "number" ? parsed.decimals : null,
  };
}

/**
 * Jupiter's public token endpoint. It runs its own indexer, so it answers the
 * holder question that free RPCs refuse, and it publishes real 1h/6h/24h
 * holder change percentages measured against its own history.
 */
interface JupToken {
  id: string;
  decimals?: number;
  circSupply?: number;
  holderCount?: number;
  stats1h?: { holderChange?: number };
  stats6h?: { holderChange?: number };
  stats24h?: { holderChange?: number };
  audit?: {
    mintAuthorityDisabled?: boolean;
    freezeAuthorityDisabled?: boolean;
    topHoldersPercentage?: number;
  };
}

async function readJupiterToken(mint: string): Promise<JupToken | null> {
  try {
    const res = await fetch(
      `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(mint)}`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(7_000) },
    );
    if (!res.ok) return null;
    const list = (await res.json()) as JupToken[];
    return Array.isArray(list) ? (list.find((token) => token.id === mint) ?? null) : null;
  } catch {
    return null;
  }
}

interface SnapshotRow {
  holders: number | null;
  holder_accounts: number | null;
  top10_percent: number | null;
  market_cap_usd: number | null;
  captured_at: string;
}


async function readHistory(mint: string): Promise<SnapshotRow[]> {
  const client = publicClient();
  if (!client) return [];
  const since = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await client
    .from("token_metrics_snapshots")
    .select("holders, holder_accounts, top10_percent, market_cap_usd, captured_at")
    .eq("mint", mint)
    .gte("captured_at", since)
    .order("captured_at", { ascending: false })
    .limit(2000);
  return (data ?? []) as unknown as SnapshotRow[];
}

/** Writes a snapshot at most every 15 minutes so history stays cheap. */
async function recordSnapshot(
  mint: string,
  intel: {
    holders: number | null;
    accounts: number | null;
    top10Percent: number | null;
  },
  market: Awaited<ReturnType<typeof readMarketSnapshot>>,
  newestAt: string | null,
) {
  if (newestAt && Date.now() - new Date(newestAt).getTime() < 15 * 60 * 1000) return;
  // Never write a holder-less or zero row: the timeframe grid reads these
  // snapshots as fact, so a bad row shows up as a fake swing forever.
  if (!intel.holders || intel.holders <= 0) return;
  try {

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("token_metrics_snapshots").insert({
      mint,
      holders: intel.holders,
      holder_accounts: intel.accounts,
      top10_percent: intel.top10Percent,
      price_usd: market.priceUsd,
      market_cap_usd: market.marketCapUsd ?? market.fdvUsd,
      liquidity_usd: market.liquidityUsd,
      volume_24h_usd: market.volume24hUsd,
      buys_24h: market.txns24h?.buys ?? null,
      sells_24h: market.txns24h?.sells ?? null,
    });
  } catch {
    /* history is a nice-to-have; never break the page for it */
  }
}

function buildDeltas(current: number | null, history: SnapshotRow[]): HolderDelta[] {
  const now = Date.now();
  const withHolders = history.filter((row) => row.holders !== null);
  const oldest = withHolders[withHolders.length - 1];
  return TIMEFRAMES.map(({ key, label, hours }) => {
    if (current === null)
      return {
        key,
        label,
        from: null,
        change: null,
        percent: null,
        agedHours: null,
        partial: false,
      };
    const target = now - hours * 3600_000;
    // Newest snapshot at or before the window start; tolerate a stale-by-half window.
    let match = withHolders.find(
      (row) => new Date(row.captured_at).getTime() <= target + 5 * 60_000,
    );
    // No snapshot that old yet: fall back to the oldest one we have, but only
    // when it covers at least half the window.
    if (!match && oldest) {
      const coveredHours = (now - new Date(oldest.captured_at).getTime()) / 3600_000;
      if (coveredHours >= hours * 0.5) match = oldest;
    }
    if (!match || match.holders === null) {
      return {
        key,
        label,
        from: null,
        change: null,
        percent: null,
        agedHours: null,
        partial: false,
      };
    }
    const from = match.holders;
    const agedHours = (now - new Date(match.captured_at).getTime()) / 3600_000;
    // Flag the window whenever the snapshot we compared against is meaningfully
    // older or newer than the window it stands in for, so the UI can say what
    // it actually measured instead of implying an exact 1h/24h figure.
    const partial = Math.abs(agedHours - hours) > Math.max(hours * 0.25, 0.5);
    return {
      key,
      label,
      from,
      change: current - from,
      percent: from > 0 ? ((current - from) / from) * 100 : null,
      agedHours,
      partial,
    };
  });
}


const TTL_MS = 5 * 60_000;
let cache: { at: number; intel: TokenIntel } | null = null;

function empty(
  status: TokenIntel["status"],
  message: string | null,
  mint: string | null,
): TokenIntel {
  return {
    status,
    mint,
    holders: null,
    holderAccounts: null,
    holderDeltas: TIMEFRAMES.map(({ key, label }) => ({
      key,
      label,
      from: null,
      change: null,
      percent: null,
      agedHours: null,
      partial: false,
    })),
    top10Percent: null,
    mintAuthorityRevoked: null,
    freezeAuthorityRevoked: null,
    circulatingSupply: null,
    liquidityToMcapPercent: null,
    turnover24hPercent: null,
    buyPressurePercent: null,
    avgTradeUsd: null,
    volumePerHolderUsd: null,
    mcapPerHolderUsd: null,
    recordedPeakHolders: null,
    recordedPeakMarketCapUsd: null,
    historyPoints: 0,
    trackingSince: null,
    fetchedAt: new Date().toISOString(),
    message,
  };
}

/** Builds the public on-chain intel panel. Never throws. */
export async function readTokenIntel(): Promise<TokenIntel> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.intel;

  const market = await readMarketSnapshot();
  const mint = market.config.contractAddress;

  if (!market.config.marketDataEnabled) {
    return empty("disabled", "On-chain tracking is paused by the owner.", mint);
  }
  if (!mint) {
    return empty(
      "awaiting_contract",
      "Holder tracking switches on the moment an official mint address is published.",
      null,
    );
  }

  const [counts, authorities, history] = await Promise.all([
    countHolders(mint),
    readAuthorities(mint),
    readHistory(mint),
  ]);

  // Market-shape ratios come from Dexscreener, not the RPC, so they stay
  // available even when the account scan is rate-limited.
  const mcapNow = market.marketCapUsd ?? market.fdvUsd;
  const txnsNow = (market.txns24h?.buys ?? 0) + (market.txns24h?.sells ?? 0);
  const applyMarket = (target: TokenIntel, holderCount: number | null) => {
    target.liquidityToMcapPercent =
      market.liquidityUsd !== null && mcapNow ? (market.liquidityUsd / mcapNow) * 100 : null;
    target.turnover24hPercent =
      market.volume24hUsd !== null && mcapNow ? (market.volume24hUsd / mcapNow) * 100 : null;
    target.buyPressurePercent = txnsNow > 0 ? ((market.txns24h?.buys ?? 0) / txnsNow) * 100 : null;
    target.avgTradeUsd =
      txnsNow > 0 && market.volume24hUsd !== null ? market.volume24hUsd / txnsNow : null;
    target.volumePerHolderUsd =
      holderCount && holderCount > 0 && market.volume24hUsd !== null
        ? market.volume24hUsd / holderCount
        : null;
    target.mcapPerHolderUsd =
      holderCount && holderCount > 0 && mcapNow ? mcapNow / holderCount : null;
  };

  if (!counts) {
    const stale = cache?.intel;
    if (stale && stale.status === "live") return stale;
    // No in-memory cache (fresh worker): fall back to the newest snapshot we
    // recorded ourselves, clearly labelled as recorded rather than live.
    const recorded = history.find((row) => row.holders !== null);
    if (recorded && recorded.holders !== null) {
      const minutes = Math.round((Date.now() - new Date(recorded.captured_at).getTime()) / 60_000);
      const agedH = (Date.now() - new Date(recorded.captured_at).getTime()) / 3600_000;
      const fallback = empty(
        "live",
        `Public chain endpoints are refusing the holder scan right now, so this holder figure is our last recorded snapshot (${minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`} ago). Timeframe changes stay blank until a live read succeeds.`,
        mint,
      );
      fallback.holders = recorded.holders;
      fallback.holderAccounts = recorded.holder_accounts;
      fallback.top10Percent = recorded.top10_percent;
      // Deltas would compare a stale figure against the same stale series, so
      // they'd read as "0% change" — leave them blank instead of implying calm.
      fallback.holderDeltas =
        agedH <= 1 ? buildDeltas(recorded.holders, history) : fallback.holderDeltas;

      fallback.historyPoints = history.length;
      fallback.trackingSince = history[history.length - 1]?.captured_at ?? null;
      fallback.mintAuthorityRevoked = authorities.mintAuthorityRevoked;
      fallback.freezeAuthorityRevoked = authorities.freezeAuthorityRevoked;
      applyMarket(fallback, recorded.holders);
      fallback.recordedPeakHolders = history.reduce<number | null>(
        (peak, row) =>
          row.holders !== null && (peak === null || row.holders > peak) ? row.holders : peak,
        recorded.holders,
      );
      return fallback;
    }
    return empty(
      "unavailable",
      "On-chain holder data is temporarily unavailable — it will refresh automatically.",
      mint,
    );
  }

  const mcap = market.marketCapUsd ?? market.fdvUsd;
  const txns = (market.txns24h?.buys ?? 0) + (market.txns24h?.sells ?? 0);
  const holders = counts.holders;
  // Concentration and circulating supply come from the same account scan, so
  // they never disagree with the holder count and need no extra RPC call.
  const top10Percent = counts.rawTotal > 0 ? (counts.rawTop10 / counts.rawTotal) * 100 : null;
  const circulatingSupply =
    authorities.decimals !== null ? counts.rawTotal / 10 ** authorities.decimals : null;

  await recordSnapshot(
    mint,
    { holders, accounts: counts.accounts, top10Percent },
    market,
    history[0]?.captured_at ?? null,
  );

  const oldest = history.length > 0 ? history[history.length - 1] : undefined;

  const intel: TokenIntel = {
    status: "live",
    mint,
    holders,
    holderAccounts: counts.accounts,
    holderDeltas: buildDeltas(holders, history),
    top10Percent,
    circulatingSupply,
    mintAuthorityRevoked: authorities.mintAuthorityRevoked,
    freezeAuthorityRevoked: authorities.freezeAuthorityRevoked,
    liquidityToMcapPercent:
      market.liquidityUsd !== null && mcap ? (market.liquidityUsd / mcap) * 100 : null,
    turnover24hPercent:
      market.volume24hUsd !== null && mcap ? (market.volume24hUsd / mcap) * 100 : null,
    buyPressurePercent: txns > 0 ? ((market.txns24h?.buys ?? 0) / txns) * 100 : null,
    avgTradeUsd: txns > 0 && market.volume24hUsd !== null ? market.volume24hUsd / txns : null,
    volumePerHolderUsd:
      holders > 0 && market.volume24hUsd !== null ? market.volume24hUsd / holders : null,
    mcapPerHolderUsd: holders > 0 && mcap ? mcap / holders : null,
    recordedPeakHolders: history.reduce<number | null>(
      (peak, row) =>
        row.holders !== null && (peak === null || row.holders > peak) ? row.holders : peak,
      holders,
    ),
    recordedPeakMarketCapUsd: history.reduce<number | null>(
      (peak, row) =>
        row.market_cap_usd !== null && (peak === null || row.market_cap_usd > peak)
          ? row.market_cap_usd
          : peak,
      mcap ?? null,
    ),
    historyPoints: history.length,
    trackingSince: oldest?.captured_at ?? null,
    fetchedAt: new Date().toISOString(),
    message: null,
  };

  cache = { at: Date.now(), intel };
  return intel;
}
