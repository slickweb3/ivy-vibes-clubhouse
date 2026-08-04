/**
 * Public on-chain intel server function (holders, concentration, ratios).
 * Safe for SSR: reads published config, the Solana RPC and our own history.
 */
import { createServerFn } from "@tanstack/react-start";
import type { TokenIntel } from "@/lib/token-intel.server";

export const getTokenIntel = createServerFn({ method: "GET" }).handler(
  async (): Promise<TokenIntel> => {
    const { readTokenIntel } = await import("@/lib/token-intel.server");
    return readTokenIntel();
  },
);
