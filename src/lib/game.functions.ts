/**
 * Public server functions for the Lily Pad Leap leaderboard.
 * Thin wrappers only — all logic lives in game.server.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Leaderboard, SubmitResult } from "@/lib/game.server";

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
});

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { recordScore } = await import("@/lib/game.server");
    return recordScore(data);
  });
