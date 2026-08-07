/**
 * Server-only live market reader.
 *
 * Truth rules:
 * - Nothing is invented. If the database has no contract address, the site
 *   reports `awaiting_contract` and every number stays "Coming Soon".
 * - Market numbers come from Dexscreener's public API for the exact mint
 *   stored in `project_config.contract_address`. No estimates, no fallbacks.
 * - The chart is an embed URL only; it is never loaded without user consent.
 */
import { publicClient } from "@/lib/media-read.server";

export type MarketStatus =
  | "disabled" // owner turned live market data off
  | "awaiting_contract" // no mint address configured yet
  | "awaiting_pair" // mint configured, no tradeable pair indexed yet
  | "live"
  | "unavailable"; // provider unreachable — we say so instead of guessing

export interface TokenLaunchConfig {
  blockchain: string | null;
  contractAddress: string | null;
  devWalletAddress: string | null;
  pairAddress: string | null;
  launchDate: string | null;
  tokenSupply: string | null;
  launchPlatform: string | null;
  launchPlatformUrl: string | null;
  chartProvider: string;
  marketDataEnabled: boolean;
}

export interface MarketSnapshot {
  status: MarketStatus;
  provider: "dexscreener";
  config: TokenLaunchConfig;
  /** Dexscreener pair page (human link). */
  pairUrl: string | null;
  /** Consent-gated iframe URL. Null until a pair exists. */
  chartEmbedUrl: string | null;
  dexId: string | null;
  priceUsd: number | null;
  priceChange24h: number | null;
  /** % change over 5m / 1h / 6h / 24h windows (Dexscreener). Used for the mini sparkline. */
  priceChanges: {
    m5: number | null;
    h1: number | null;
    h6: number | null;
    h24: number | null;
  } | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  txns24h: { buys: number; sells: number } | null;
  pairCreatedAt: string | null;
  fetchedAt: string;
  message: string | null;
}

const DEFAULT_CONFIG: TokenLaunchConfig = {
  blockchain: null,
  contractAddress: null,
  devWalletAddress: null,
  pairAddress: null,
  launchDate: null,
  tokenSupply: null,
  launchPlatform: null,
  launchPlatformUrl: null,
  chartProvider: "dexscreener",
  marketDataEnabled: true,
};

function emptySnapshot(
  status: MarketStatus,
  config: TokenLaunchConfig,
  message: string | null = null,
): MarketSnapshot {
  return {
    status,
    provider: "dexscreener",
    config,
    pairUrl: null,
    chartEmbedUrl: null,
    dexId: null,
    priceUsd: null,
    priceChange24h: null,
    priceChanges: null,
    marketCapUsd: null,
    fdvUsd: null,
    liquidityUsd: null,
    volume24hUsd: null,
    txns24h: null,
    pairCreatedAt: null,
    fetchedAt: new Date().toISOString(),
    message,
  };
}

const str = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null);
const numOf = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Reads the launch/market configuration from the published project row. */
export async function readTokenLaunchConfig(): Promise<TokenLaunchConfig> {
  const client = publicClient();
  if (!client) return DEFAULT_CONFIG;

  const { data } = await client
    .from("project_config")
    .select(
      "blockchain, contract_address, dev_wallet_address, pair_address, launch_date, token_supply, launch_platform, launch_platform_url, chart_provider, market_data_enabled",
    )
    .limit(1)
    .maybeSingle();

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    blockchain: str(row.blockchain),
    contractAddress: str(row.contract_address),
    devWalletAddress: str(row.dev_wallet_address),
    pairAddress: str(row.pair_address),
    launchDate: str(row.launch_date),
    tokenSupply: str(row.token_supply),
    launchPlatform: str(row.launch_platform),
    launchPlatformUrl: str(row.launch_platform_url),
    chartProvider: str(row.chart_provider) ?? "dexscreener",
    marketDataEnabled: row.market_data_enabled !== false,
  };
}

interface DexPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  liquidity?: { usd?: number };
  volume?: Record<string, number>;
  priceChange?: Record<string, number>;
  txns?: Record<string, { buys?: number; sells?: number }>;
}

async function fetchDexscreener(mint: string): Promise<DexPair[] | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { pairs?: DexPair[] | null };
    return Array.isArray(json.pairs) ? json.pairs : [];
  } catch {
    return null;
  }
}

/**
 * Short-lived snapshot cache. Dexscreener data only moves every few seconds,
 * so serving it from memory for 30s keeps TTFB flat under bursts and lets a
 * provider hiccup fall back to the last good numbers instead of blanking the
 * panel (which used to look like the page had "reset").
 */
const SNAPSHOT_TTL_MS = 30_000;
let snapshotCache: { at: number; snapshot: MarketSnapshot } | null = null;

/** Builds the public market snapshot. Never throws. */
export async function readMarketSnapshot(): Promise<MarketSnapshot> {
  const now = Date.now();
  if (snapshotCache && now - snapshotCache.at < SNAPSHOT_TTL_MS) {
    return snapshotCache.snapshot;
  }
  const snapshot = await buildMarketSnapshot();
  // Never replace live numbers with an "unavailable" card on a transient failure.
  if (snapshot.status !== "live" && snapshotCache?.snapshot.status === "live") {
    return snapshotCache.snapshot;
  }
  snapshotCache = { at: now, snapshot };
  return snapshot;
}

async function buildMarketSnapshot(): Promise<MarketSnapshot> {
  let config = DEFAULT_CONFIG;
  try {
    config = await readTokenLaunchConfig();
  } catch {
    /* fall through with defaults */
  }

  if (!config.marketDataEnabled) {
    return emptySnapshot("disabled", config, "Live market data is turned off by the owner.");
  }

  if (!config.contractAddress) {
    return emptySnapshot(
      "awaiting_contract",
      config,
      config.devWalletAddress
        ? "The creator wallet is on file. The moment the official mint address is published here, the chart and stats switch on automatically."
        : "No contract address exists yet. Every market figure stays Coming Soon until it does.",
    );
  }

  const pairs = await fetchDexscreener(config.contractAddress);
  if (pairs === null) {
    return emptySnapshot(
      "unavailable",
      config,
      "The market data provider is unreachable right now.",
    );
  }
  if (pairs.length === 0) {
    return emptySnapshot(
      "awaiting_pair",
      config,
      "The mint is published but no trading pair is indexed yet. Stats appear as soon as the pair goes live.",
    );
  }

  const preferred = config.pairAddress
    ? pairs.find((p) => p.pairAddress?.toLowerCase() === config.pairAddress?.toLowerCase())
    : undefined;
  const best =
    preferred ?? [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

  const chain = best.chainId ?? "solana";
  const pairAddress = best.pairAddress ? best.pairAddress.toLowerCase() : null;

  return {
    status: "live",
    provider: "dexscreener",
    config,
    pairUrl: best.url ?? (pairAddress ? `https://dexscreener.com/${chain}/${pairAddress}` : null),
    chartEmbedUrl: pairAddress
      ? `https://dexscreener.com/${chain}/${pairAddress}?embed=1&theme=dark&info=0`
      : null,
    dexId: best.dexId ?? null,
    priceUsd: numOf(best.priceUsd),
    priceChange24h: numOf(best.priceChange?.h24),
    priceChanges: {
      m5: numOf(best.priceChange?.m5),
      h1: numOf(best.priceChange?.h1),
      h6: numOf(best.priceChange?.h6),
      h24: numOf(best.priceChange?.h24),
    },
    marketCapUsd: numOf(best.marketCap),
    fdvUsd: numOf(best.fdv),
    liquidityUsd: numOf(best.liquidity?.usd),
    volume24hUsd: numOf(best.volume?.h24),
    txns24h: best.txns?.h24
      ? { buys: best.txns.h24.buys ?? 0, sells: best.txns.h24.sells ?? 0 }
      : null,
    pairCreatedAt: best.pairCreatedAt ? new Date(best.pairCreatedAt).toISOString() : null,
    fetchedAt: new Date().toISOString(),
    message: null,
  };
}

export const EMPTY_MARKET_SNAPSHOT_STATUS: MarketStatus = "awaiting_contract";
export { DEFAULT_CONFIG as DEFAULT_TOKEN_LAUNCH_CONFIG };
