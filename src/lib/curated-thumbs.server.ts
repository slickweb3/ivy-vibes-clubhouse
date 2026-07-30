/**
 * Official poster images for curated posts.
 *
 * TikTok publishes an oEmbed endpoint (https://www.tiktok.com/oembed) that
 * returns the post's own thumbnail URL, author and original caption for the
 * express purpose of embedding. That is an official API, not scraping, and no
 * media is downloaded or re-hosted here: the returned CDN URL is displayed
 * directly and the video itself always plays inside TikTok's official player.
 *
 * TikTok's thumbnail URLs are signed and expire after a couple of days, so the
 * value is cached in the database and refreshed in the background when stale.
 */

const OEMBED = "https://www.tiktok.com/oembed?url=";
/** Refresh anything older than this on the next server render. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;

export interface TikTokPoster {
  thumbnailUrl: string | null;
  originalCaption: string | null;
}

interface StaleRow {
  id: string;
  postUrl: string;
}

async function fetchPoster(postUrl: string): Promise<TikTokPoster | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${OEMBED}${encodeURIComponent(postUrl)}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    const thumbnailUrl = typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
    const title = typeof data.title === "string" ? data.title.trim() : "";
    return { thumbnailUrl, originalCaption: title.length > 0 ? title : null };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function isPosterStale(fetchedAt: string | null): boolean {
  if (!fetchedAt) return true;
  const time = Date.parse(fetchedAt);
  if (Number.isNaN(time)) return true;
  return Date.now() - time > MAX_AGE_MS;
}

/**
 * Refreshes stale TikTok posters and writes them back to the cache.
 * Never throws: a TikTok outage simply leaves the previous poster in place.
 */
export async function refreshTikTokPosters(
  rows: StaleRow[],
): Promise<Map<string, TikTokPoster>> {
  const results = new Map<string, TikTokPoster>();
  if (rows.length === 0) return results;

  const limited = rows.slice(0, 40);
  const posters = await Promise.all(
    limited.map(async (row) => ({ row, poster: await fetchPoster(row.postUrl) })),
  );

  const updates = posters.filter(
    (entry): entry is { row: StaleRow; poster: TikTokPoster } =>
      entry.poster !== null && entry.poster.thumbnailUrl !== null,
  );
  if (updates.length === 0) return results;

  for (const { row, poster } of updates) results.set(row.id, poster);

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await Promise.all(
      updates.map(({ row, poster }) =>
        supabaseAdmin
          .from("curated_social_posts")
          .update({
            thumbnail_url: poster.thumbnailUrl,
            original_caption: poster.originalCaption,
            thumbnail_fetched_at: now,
          })
          .eq("id", row.id),
      ),
    );
  } catch {
    // Cache write failed — the posters above are still returned for this render.
  }

  return results;
}
