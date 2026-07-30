/**
 * Server-only reader for curated official social posts.
 *
 * Reads this project's own database only. It never calls Instagram or TikTok
 * and never stores or proxies platform media.
 */
import {
  EMPTY_CURATED_FEED,
  type CuratedFeed,
  type CuratedPlacement,
  type CuratedPost,
} from "@/types/curated";

type Row = Record<string, unknown>;

function normalize(row: Row): CuratedPost {
  const placements = Array.isArray(row.placements) ? (row.placements as string[]) : [];
  return {
    id: String(row.id),
    platform: row.platform === "tiktok" ? "tiktok" : "instagram",
    originalPostUrl: String(row.original_post_url ?? ""),
    platformPostId: String(row.platform_post_id ?? ""),
    officialEmbedUrl: String(row.official_embed_url ?? ""),
    adminLabel: typeof row.admin_label === "string" && row.admin_label ? row.admin_label : null,
    placements: placements.filter((p): p is CuratedPlacement =>
      ["hero", "fresh_posts", "ivy_tv", "hall_of_fame"].includes(p),
    ),
    isVisible: row.is_visible !== false,
    isActive: row.is_active !== false,
    isPinned: row.is_pinned === true,
    isFeatured: row.is_featured === true,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
    sourceAccountHandle: String(row.source_account_handle ?? ""),
    sourceAccountUrl: String(row.source_account_url ?? ""),
    thumbnailUrl:
      typeof row.thumbnail_url === "string" && row.thumbnail_url ? row.thumbnail_url : null,
    originalCaption:
      typeof row.original_caption === "string" && row.original_caption
        ? row.original_caption
        : null,
  };
}

const COLUMNS =
  "id, platform, original_post_url, platform_post_id, official_embed_url, admin_label, placements, is_visible, is_active, is_pinned, is_featured, display_order, source_account_handle, source_account_url, thumbnail_url, original_caption, thumbnail_fetched_at";

export async function readCuratedFeed(): Promise<CuratedFeed> {
  const { publicClient } = await import("./media-read.server");
  const supabase = publicClient();
  if (!supabase) return EMPTY_CURATED_FEED;

  try {
    const { data, error } = await supabase
      .from("curated_social_posts")
      .select(COLUMNS)
      .order("display_order", { ascending: true })
      .limit(200);

    if (error || !data) return EMPTY_CURATED_FEED;

    const rows = data as Row[];
    // Keep TikTok posters fresh (their CDN links are signed and short-lived) so
    // every card shows a real picture before the official player is opened.
    try {
      const { isPosterStale, refreshTikTokPosters } = await import("./curated-thumbs.server");
      const stale = rows
        .filter(
          (row) =>
            row.platform === "tiktok" &&
            row.is_active !== false &&
            row.is_visible !== false &&
            isPosterStale(
              typeof row.thumbnail_fetched_at === "string" ? row.thumbnail_fetched_at : null,
            ),
        )
        .map((row) => ({ id: String(row.id), postUrl: String(row.original_post_url ?? "") }));
      const refreshed = await refreshTikTokPosters(stale);
      for (const row of rows) {
        const poster = refreshed.get(String(row.id));
        if (poster) {
          row.thumbnail_url = poster.thumbnailUrl;
          row.original_caption = poster.originalCaption ?? row.original_caption;
        }
      }
    } catch {
      // Posters stay as cached; embeds still work.
    }

    const all = rows
      .map(normalize)
      .filter((post) => post.isVisible && post.isActive)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.displayOrder - b.displayOrder;
      });

    const inPlacement = (placement: CuratedPlacement) =>
      all.filter((post) => post.placements.includes(placement));

    const heroCandidates = inPlacement("hero");
    const hero =
      heroCandidates.find((post) => post.isPinned) ?? heroCandidates[0] ?? null;

    return {
      all,
      hero,
      freshPosts: inPlacement("fresh_posts"),
      ivyTv: inPlacement("ivy_tv"),
      hallOfFame: inPlacement("hall_of_fame"),
      count: all.length,
    };
  } catch {
    return EMPTY_CURATED_FEED;
  }
}
