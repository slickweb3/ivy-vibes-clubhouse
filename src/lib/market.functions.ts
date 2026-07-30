/**
 * Public market snapshot server function.
 * Safe for SSR: it reads published config + a public market API only.
 */
import { createServerFn } from "@tanstack/react-start";
import type { MarketSnapshot } from "@/lib/market.server";

export const getMarketSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketSnapshot> => {
    const { readMarketSnapshot } = await import("@/lib/market.server");
    return readMarketSnapshot();
  },
);
