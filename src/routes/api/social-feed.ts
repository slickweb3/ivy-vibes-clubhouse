/**
 * GET /api/social-feed
 *
 * Public, read-only. Serves ONLY from this project's own database cache.
 * It never contacts Instagram or TikTok, never returns provider payloads and
 * never exposes credentials.
 *
 * Response shape is fixed:
 *   { instagram: SocialPost[], tiktok: SocialPost[], lastUpdated, status }
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/social-feed")({
  server: {
    handlers: {
      GET: async () => {
        const { readCachedFeed } = await import("@/lib/social-feed.server");
        const feed = await readCachedFeed();

        return new Response(JSON.stringify(feed), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            // Cheap for crawlers and bursty traffic; the cache is refreshed
            // by the scheduled sync, not by page loads.
            "cache-control": "public, max-age=300, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});
