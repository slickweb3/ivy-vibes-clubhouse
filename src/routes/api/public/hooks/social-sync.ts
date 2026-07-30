/**
 * Scheduled sync endpoint — called roughly every 12 hours by pg_cron.
 *
 * Protected by the shared `SOCIAL_SYNC_SECRET` header. Returns sanitized
 * counts only; never provider payloads, never tokens.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/social-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SOCIAL_SYNC_SECRET;
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json; charset=utf-8" },
          });

        if (!secret) {
          return json(
            {
              ok: false,
              error: "not_configured",
              message: "SOCIAL_SYNC_SECRET is not set. The scheduled sync is disabled.",
            },
            503,
          );
        }

        const provided = request.headers.get("x-sync-secret") ?? "";
        // Length-independent constant-ish comparison.
        if (provided.length !== secret.length || provided !== secret) {
          return json({ ok: false, error: "unauthorized" }, 401);
        }

        const { runScheduledSync } = await import("@/lib/social-sync.server");
        const results = await runScheduledSync();
        return json({ ok: true, ranAt: new Date().toISOString(), results });
      },
    },
  },
});
