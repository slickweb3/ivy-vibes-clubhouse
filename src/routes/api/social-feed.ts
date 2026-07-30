import { createFileRoute } from "@tanstack/react-router";
import { readCachedFeed } from "@/data/social";

/**
 * Public read-only social feed.
 * Reads ONLY from the local cache / database. It never calls Instagram,
 * TikTok, or any external platform at request time.
 */
export const Route = createFileRoute("/api/social-feed")({
  server: {
    handlers: {
      GET: async () => {
        const feed = readCachedFeed();
        return Response.json(feed, {
          headers: { "cache-control": "public, max-age=300" },
        });
      },
    },
  },
});
