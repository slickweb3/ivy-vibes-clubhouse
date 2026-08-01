/**
 * Admin-only monthly winners view: who topped each season of Lily Pad Leap
 * and whether their airdrop has been sent. Staff role required.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface WinnerRow {
  place: number;
  wallet: string;
  score: number;
  plays: number;
  lastPlayedAt: string;
  tokens: number;
  paidAt: string | null;
  txSignature: string | null;
  note: string | null;
}

export interface SeasonWinners {
  season: string;
  label: string;
  isCurrent: boolean;
  isComplete: boolean;
  players: number;
  winners: WinnerRow[];
}

export interface MonthlyWinners {
  currentSeason: string;
  prizeTokens: number;
  seasons: SeasonWinners[];
}

function seasonLabel(season: string): string {
  const [year, month] = season.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const getMonthlyWinners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MonthlyWinners> => {
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(context.supabase, context.userId);

    const { currentSeason, PRIZE_TOKENS } = await import("@/lib/game.server");
    const nowSeason = currentSeason();

    const { data: scores } = await context.supabase
      .from("game_scores")
      .select("wallet_address, season, best_score, plays, last_played_at")
      .order("best_score", { ascending: false });

    const { data: payouts } = await context.supabase
      .from("game_payouts")
      .select("season, place, tokens, paid_at, tx_signature, note");

    const bySeason = new Map<
      string,
      { wallet: string; score: number; plays: number; lastPlayedAt: string }[]
    >();
    for (const row of scores ?? []) {
      const season = row.season as string;
      const list = bySeason.get(season) ?? [];
      list.push({
        wallet: row.wallet_address as string,
        score: row.best_score as number,
        plays: row.plays as number,
        lastPlayedAt: row.last_played_at as string,
      });
      bySeason.set(season, list);
    }

    const payoutKey = (season: string, place: number) => `${season}#${place}`;
    const payoutMap = new Map(
      (payouts ?? []).map((row) => [
        payoutKey(row.season as string, row.place as number),
        row as {
          tokens: number;
          paid_at: string | null;
          tx_signature: string | null;
          note: string | null;
        },
      ]),
    );

    const seasons: SeasonWinners[] = Array.from(bySeason.keys())
      .sort()
      .reverse()
      .map((season) => {
        const list = (bySeason.get(season) ?? [])
          .slice()
          .sort((a, b) => b.score - a.score || a.lastPlayedAt.localeCompare(b.lastPlayedAt));
        const winners = list.slice(0, 3).map((entry, index) => {
          const place = index + 1;
          const payout = payoutMap.get(payoutKey(season, place));
          return {
            place,
            wallet: entry.wallet,
            score: entry.score,
            plays: entry.plays,
            lastPlayedAt: entry.lastPlayedAt,
            tokens: payout?.tokens ?? (place === 1 ? PRIZE_TOKENS : 0),
            paidAt: payout?.paid_at ?? null,
            txSignature: payout?.tx_signature ?? null,
            note: payout?.note ?? null,
          };
        });
        return {
          season,
          label: seasonLabel(season),
          isCurrent: season === nowSeason,
          isComplete: season < nowSeason,
          players: list.length,
          winners,
        };
      });

    return { currentSeason: nowSeason, prizeTokens: PRIZE_TOKENS, seasons };
  });

export const recordPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        season: z.string().regex(/^\d{4}-\d{2}$/),
        place: z.number().int().min(1).max(3),
        wallet: z.string().min(32).max(64),
        score: z.number().int().min(0),
        tokens: z.number().int().min(0).max(1_000_000_000),
        paid: z.boolean(),
        txSignature: z.string().trim().max(200).optional(),
        note: z.string().trim().max(400).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(context.supabase, context.userId);

    const { error } = await context.supabase.from("game_payouts").upsert(
      {
        season: data.season,
        place: data.place,
        wallet_address: data.wallet,
        score: data.score,
        tokens: data.tokens,
        paid_at: data.paid ? new Date().toISOString() : null,
        tx_signature: data.txSignature ? data.txSignature : null,
        note: data.note ? data.note : null,
      },
      { onConflict: "season,place" },
    );
    if (error) throw new Error("Could not save the payout record.");
    return { ok: true };
  });
