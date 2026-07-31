/**
 * Lily Pad Leap — server-only leaderboard logic.
 *
 * Scores are only recorded when the player proves control of the Solana
 * wallet by signing a one-time challenge with it. Nothing here trusts the
 * client's word about who they are, and every run is bounded by a plausible
 * score-per-second ceiling so the monthly airdrop list stays honest.
 */
import { createClient } from "@supabase/supabase-js";
import { ed25519 } from "@noble/curves/ed25519.js";
import bs58 from "bs58";
import type { Database } from "@/integrations/supabase/types";

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  score: number;
  plays: number;
  lastPlayedAt: string;
}

export interface Leaderboard {
  season: string;
  seasonLabel: string;
  /** Current calendar month — the list the monthly airdrop is paid from. */
  monthly: LeaderboardEntry[];
  /** Best single run ever, for bragging rights only. */
  allTime: LeaderboardEntry[];
  prizeTokens: number;
  nextResetIso: string;
}

export const PRIZE_TOKENS = 50_000;
/** Generous ceiling: a clean run scores well under this per second. */
const MAX_SCORE_PER_SECOND = 120;
const MAX_SCORE = 250_000;
const MIN_RUN_SECONDS = 3;
const NONCE_TTL_MS = 45 * 60 * 1000;

export function currentSeason(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function seasonLabel(season: string): string {
  const [year, month] = season.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function nextResetIso(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export function isSolanaAddress(value: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false;
  try {
    return bs58.decode(value).length === 32;
  } catch {
    return false;
  }
}

export function challengeMessage(input: {
  wallet: string;
  score: number;
  nonce: string;
}): string {
  return [
    "ivy vibing — Lily Pad Leap",
    "Signing this only proves you own this wallet. It never moves funds.",
    `Wallet: ${input.wallet}`,
    `Score: ${input.score}`,
    `Nonce: ${input.nonce}`,
  ].join("\n");
}

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type ScoreRow = {
  wallet_masked: string;
  best_score: number;
  plays: number;
  last_played_at: string;
};

function toEntries(rows: ScoreRow[]): LeaderboardEntry[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    wallet: row.wallet_masked,
    score: row.best_score,
    plays: row.plays,
    lastPlayedAt: row.last_played_at,
  }));
}

export async function readLeaderboard(): Promise<Leaderboard> {
  const season = currentSeason();
  const empty: Leaderboard = {
    season,
    seasonLabel: seasonLabel(season),
    monthly: [],
    allTime: [],
    prizeTokens: PRIZE_TOKENS,
    nextResetIso: nextResetIso(),
  };

  try {
    const supabase = publicClient();
    // Public reads go through a capped, wallet-masked function; the raw
    // game_scores table is not readable by anon/authenticated visitors.
    const [monthly, allTime] = await Promise.all([
      supabase.rpc("leaderboard_top", { _season: season, _limit: 20 }),
      supabase.rpc("leaderboard_top", { _season: null, _limit: 10 }),
    ]);

    return {
      ...empty,
      monthly: toEntries((monthly.data ?? []) as ScoreRow[]),
      allTime: toEntries((allTime.data ?? []) as ScoreRow[]),
    };
  } catch {
    // Never break the page over a leaderboard read.
    return empty;
  }
}


export async function issueNonce(): Promise<{ nonce: string; issuedAt: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS).toISOString();
  const { error } = await supabaseAdmin
    .from("game_nonces")
    .insert({ nonce, expires_at: expiresAt });
  if (error) throw new Error("Could not start a verified run right now.");
  return { nonce, issuedAt: new Date().toISOString() };
}

export interface SubmitResult {
  accepted: boolean;
  reason?: string;
  bestScore?: number;
  rank?: number | null;
}

export async function recordScore(input: {
  wallet: string;
  score: number;
  nonce: string;
  signature: string;
}): Promise<SubmitResult> {
  const wallet = input.wallet.trim();
  const score = Math.floor(input.score);

  if (!isSolanaAddress(wallet)) return { accepted: false, reason: "That is not a Solana address." };
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return { accepted: false, reason: "That score is out of range." };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: nonceRow } = await supabaseAdmin
    .from("game_nonces")
    .select("id, nonce, expires_at, consumed_at, created_at")
    .eq("nonce", input.nonce)
    .maybeSingle();

  if (!nonceRow || nonceRow.consumed_at || new Date(nonceRow.expires_at) < new Date()) {
    return { accepted: false, reason: "This run expired. Play another one." };
  }

  const elapsedSeconds = (Date.now() - new Date(nonceRow.created_at).getTime()) / 1000;
  if (elapsedSeconds < MIN_RUN_SECONDS) {
    return { accepted: false, reason: "That run was too short to count." };
  }
  if (score > elapsedSeconds * MAX_SCORE_PER_SECOND) {
    return { accepted: false, reason: "That score does not match the run length." };
  }

  let verified = false;
  try {
    verified = ed25519.verify(
      bs58.decode(input.signature),
      new TextEncoder().encode(challengeMessage({ wallet, score, nonce: input.nonce })),
      bs58.decode(wallet),
    );
  } catch {
    verified = false;
  }
  if (!verified) return { accepted: false, reason: "Wallet signature did not check out." };

  await supabaseAdmin
    .from("game_nonces")
    .update({ consumed_at: new Date().toISOString(), wallet_address: wallet })
    .eq("id", nonceRow.id);

  const season = currentSeason();
  const { data: existing } = await supabaseAdmin
    .from("game_scores")
    .select("id, best_score, plays")
    .eq("wallet_address", wallet)
    .eq("season", season)
    .maybeSingle();

  const bestScore = Math.max(score, existing?.best_score ?? 0);

  if (existing) {
    await supabaseAdmin
      .from("game_scores")
      .update({
        best_score: bestScore,
        plays: (existing.plays ?? 0) + 1,
        last_played_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("game_scores").insert({
      wallet_address: wallet,
      season,
      best_score: bestScore,
      plays: 1,
    });
  }

  const { count } = await supabaseAdmin
    .from("game_scores")
    .select("id", { count: "exact", head: true })
    .eq("season", season)
    .gt("best_score", bestScore);

  return { accepted: true, bestScore, rank: typeof count === "number" ? count + 1 : null };
}
