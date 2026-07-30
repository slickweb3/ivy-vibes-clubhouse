/**
 * GET /api/public/curated-posts
 *
 * Public, read-only list of the curated official Instagram/TikTok posts.
 * Returns links and official embed URLs only — no captions, no media files.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/curated-posts")({
  server: {
    handlers: {
      GET: async () => {
        const { readCuratedFeed } = await import("@/lib/curated.server");
        const feed = await readCuratedFeed();

        return new Response(
          JSON.stringify({
            posts: feed.all,
            count: feed.count,
            note: "Official embed only — media and original captions remain hosted by Instagram/TikTok.",
          }),
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, max-age=300, stale-while-revalidate=3600",
            },
          },
        );
      },
    },
  },
});
