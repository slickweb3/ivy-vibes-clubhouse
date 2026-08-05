/**
 * Snapshot recorder endpoint.
 *
 * Holder history cannot be back-filled from anywhere, so the 24h / 7d / 30d
 * columns only fill in if snapshots keep getting recorded even when nobody is
 * on the site. Hitting this URL on a schedule (every 15 minutes) does that.
 * It is read-only from the caller's point of view: no input, no secrets, and
 * `readTokenIntel` itself throttles writes to one snapshot per 15 minutes.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/token-snapshot")({
  server: {
    handlers: {
      GET: async () => {
        const { readTokenIntel } = await import("@/lib/token-intel.server");
        const intel = await readTokenIntel();
        return Response.json(
          {
            status: intel.status,
            holders: intel.holders,
            historyPoints: intel.historyPoints,
            trackingSince: intel.trackingSince,
            fetchedAt: intel.fetchedAt,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
