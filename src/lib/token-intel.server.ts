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

const RPC_URL = () => process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

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
  try {
    const res = await fetch(RPC_URL(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T; error?: unknown };
    if (json.error || json.result === undefined) return null;
    return json.result;
  } catch {
    return null;
  }
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
async function countHolders(
  mint: string,
): Promise<{ holders: number; accounts: number } | null> {
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
  for (const list of results) {
    if (!list) continue;
    for (const item of list) {
      accounts += 1;
      const data = item.account?.data;
      const raw = Array.isArray(data) ? data[0] : null;
      if (raw && readAmount(raw) > 0) holders += 1;
    }
  }
  return { holders, accounts };
}

interface LargestAccounts {
  value?: Array<{ uiAmount?: number | null }>;
}
interface SupplyResult {
  value?: { uiAmount?: number | null };
}
interface MintAccountInfo {
  value?: {
    data?: {
      parsed?: { info?: { mintAuthority?: string | null; freezeAuthority?: string | null } };
    };
  };
}

async function readConcentration(mint: string) {
  const [largest, supply] = await Promise.all([
    rpc<LargestAccounts>("getTokenLargestAccounts", [mint]),
    rpc<SupplyResult>("getTokenSupply", [mint]),
  ]);
  const total = supply?.value?.uiAmount ?? null;
  const top10 = (largest?.value ?? [])
    .slice(0, 10)
    .reduce((sum, entry) => sum + (entry.uiAmount ?? 0), 0);
  return {
    circulatingSupply: total,
    top10Percent: total && total > 0 ? (top10 / total) * 100 : null,
  };
}

async function readAuthorities(mint: string) {
  const info = await rpc<MintAccountInfo>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  const parsed = info?.value?.data?.parsed?.info;
  if (!parsed) return { mintAuthorityRevoked: null, freezeAuthorityRevoked: null };
  return {
    mintAuthorityRevoked: !parsed.mintAuthority,
    freezeAuthorityRevoked: !parsed.freezeAuthority,
  };
}

interface SnapshotRow {
  holders: number | null;
  market_cap_usd: number | null;
  captured_at: string;
}

async function readHistory(mint: string): Promise<SnapshotRow[]> {
  const client = publicClient();
  if (!client) return [];
  const since = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await client
    .from("token_metrics_snapshots")
    .select("holders, market_cap_usd, captured_at")
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
  return TIMEFRAMES.map(({ key, label, hours }) => {
    if (current === null) return { key, label, from: null, change: null, percent: null, agedHours: null };
    const target = now - hours * 3600_000;
    // Newest snapshot at or before the window start; tolerate a stale-by-half window.
    const match = history.find(
      (row) =>
        row.holders !== null &&
        new Date(row.captured_at).getTime() <= target + 5 * 60_000,
    );
    if (!match || match.holders === null) {
      return { key, label, from: null, change: null, percent: null, agedHours: null };
    }
    const from = match.holders;
    const agedHours = (now - new Date(match.captured_at).getTime()) / 3600_000;
    return {
      key,
      label,
      from,
      change: current - from,
      percent: from > 0 ? ((current - from) / from) * 100 : null,
      agedHours,
    };
  });
}

const TTL_MS = 5 * 60_000;
let cache: { at: number; intel: TokenIntel } | null = null;

function empty(status: TokenIntel["status"], message: string | null, mint: string | null): TokenIntel {
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

  const [counts, concentration, authorities, history] = await Promise.all([
    countHolders(mint),
    readConcentration(mint),
    readAuthorities(mint),
    readHistory(mint),
  ]);

  if (!counts) {
    const stale = cache?.intel;
    if (stale && stale.status === "live") return stale;
    return empty(
      "unavailable",
      "The Solana RPC endpoint is not answering right now, so the holder count is unavailable.",
      mint,
    );
  }

  const mcap = market.marketCapUsd ?? market.fdvUsd;
  const txns = (market.txns24h?.buys ?? 0) + (market.txns24h?.sells ?? 0);
  const holders = counts.holders;

  await recordSnapshot(
    mint,
    { holders, accounts: counts.accounts, top10Percent: concentration.top10Percent },
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
    top10Percent: concentration.top10Percent,
    circulatingSupply: concentration.circulatingSupply,
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
      (peak, row) => (row.holders !== null && (peak === null || row.holders > peak) ? row.holders : peak),
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
