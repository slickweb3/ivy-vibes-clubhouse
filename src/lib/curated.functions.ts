/**
 * Public, unauthenticated read of the curated official-post model.
 * Exposes only visible + active rows (RLS enforces this too).
 */
import { createServerFn } from "@tanstack/react-start";
import type { CuratedFeed } from "@/types/curated";

export const getCuratedFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<CuratedFeed> => {
    const { readCuratedFeed } = await import("@/lib/curated.server");
    return readCuratedFeed();
  },
);
