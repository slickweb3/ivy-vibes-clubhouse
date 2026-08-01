/**
 * Public server functions for the Lily Pad Leap leaderboard.
 * Thin wrappers only — all logic lives in game.server.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Leaderboard, PlayerCard, SubmitResult } from "@/lib/game.server";

export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<Leaderboard> => {
    const { readLeaderboard } = await import("@/lib/game.server");
    return readLeaderboard();
  },
);

export const startRun = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ nonce: string }> => {
    const { issueNonce } = await import("@/lib/game.server");
    const { nonce } = await issueNonce();
    return { nonce };
  },
);

const submitSchema = z.object({
  wallet: z.string().min(32).max(64),
  score: z.number().int().min(0).max(250_000),
  nonce: z.string().min(16).max(64),
  signature: z.string().min(32).max(160),
  telemetry: z
    .object({
      coins: z.number().int().min(0).max(5_000).optional(),
      jumps: z.number().int().min(0).max(100_000).optional(),
      durationMs: z.number().int().min(0).max(3_600_000).optional(),
    })
    .optional(),
});

const walletSchema = z.object({ wallet: z.string().min(32).max(64) });

/**
 * Public season card for a wallet. Read-only and unauthenticated by design:
 * it returns the same masked-board data, keyed by an address the caller
 * already knows because their own wallet supplied it.
 */
export const getPlayerCard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => walletSchema.parse(data))
  .handler(async ({ data }): Promise<PlayerCard | null> => {
    const { readPlayerCard } = await import("@/lib/game.server");
    return readPlayerCard(data.wallet);
  });

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { recordScore } = await import("@/lib/game.server");
    return recordScore(data);
  });
