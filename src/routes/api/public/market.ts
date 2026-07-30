/**
 * Public read-only market endpoint.
 * Mirrors what the homepage shows. No secrets, no writes, cache-friendly.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/market")({
  server: {
    handlers: {
      GET: async () => {
        const { readMarketSnapshot } = await import("@/lib/market.server");
        const snapshot = await readMarketSnapshot();
        return Response.json(snapshot, {
          headers: { "cache-control": "public, max-age=30, s-maxage=30" },
        });
      },
    },
  },
});
