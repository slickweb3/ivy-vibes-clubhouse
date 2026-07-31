/**
 * Admin-only leaderboard export for the monthly airdrop.
 * Returns full wallet addresses; staff role required.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminScoreRow {
  wallet: string;
  season: string;
  score: number;
  plays: number;
  lastPlayedAt: string;
}

export interface AdminLeaderboard {
  season: string;
  seasons: string[];
  rows: AdminScoreRow[];
  prizeTokens: number;
}

export const getAdminLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ season: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<AdminLeaderboard> => {
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(context.supabase, context.userId);

    const { currentSeason, PRIZE_TOKENS } = await import("@/lib/game.server");
    const season = data.season ?? currentSeason();

    const { data: all } = await context.supabase.from("game_scores").select("season");
    const seasons = Array.from(new Set((all ?? []).map((row) => row.season as string))).sort().reverse();

    const { data: rows } = await context.supabase
      .from("game_scores")
      .select("wallet_address, season, best_score, plays, last_played_at")
      .eq("season", season)
      .order("best_score", { ascending: false })
      .limit(200);

    return {
      season,
      seasons: seasons.length > 0 ? seasons : [season],
      prizeTokens: PRIZE_TOKENS,
      rows: (rows ?? []).map((row) => ({
        wallet: row.wallet_address as string,
        season: row.season as string,
        score: row.best_score as number,
        plays: row.plays as number,
        lastPlayedAt: row.last_played_at as string,
      })),
    };
  });
