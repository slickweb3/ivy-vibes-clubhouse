/**
 * Server-only social feed reader.
 *
 * IMPORTANT: this module reads ONLY from this project's own database (the
 * `social_posts` cache table). It never calls Instagram or TikTok. Live
 * platform calls happen exclusively in the scheduled sync job.
 */
import { createClient } from "@supabase/supabase-js";
import type {
  PlatformStatus,
  SocialFeedResponse,
  SocialPlatform,
  SocialPost,
} from "@/types/social";
import { projectConfig } from "@/config/project";

type Row = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeRow(row: Row): SocialPost {
  return {
    id: String(row.id ?? ""),
    platform: (row.platform as SocialPlatform) ?? "instagram",
    platformPostId: str(row.platform_post_id),
    accountName: str(row.account_name),
    mediaType: (row.media_type as SocialPost["mediaType"]) ?? "image",
    caption: str(row.caption),
    customCaption: str(row.custom_caption),
    thumbnailUrl: str(row.thumbnail_url),
    fallbackThumbnailUrl: str(row.fallback_thumbnail_url),
    mediaUrl: str(row.media_url),
    embedUrl: str(row.embed_url),
    permalink: str(row.permalink),
    publishedAt: str(row.published_at),
    duration: num(row.duration),
    width: num(row.width),
    height: num(row.height),
    isFeatured: bool(row.is_featured),
    isPinned: bool(row.is_pinned),
    isVisible: bool(row.is_visible, true),
    allowAutoplay: bool(row.allow_autoplay),
    altText: typeof row.alt_text === "string" ? row.alt_text : "",
    lastSyncedAt: str(row.last_synced_at),
    syncSource: (row.sync_source as SocialPost["syncSource"]) ?? "manual",
    approvalStatus: (row.approval_status as SocialPost["approvalStatus"]) ?? "pending",
  };
}

/** Publishable-key client. RLS restricts reads to approved + visible rows. */
function publicClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function platformStatus(enabled: boolean, connected: boolean): PlatformStatus {
  if (!enabled) return "not_configured";
  return connected ? "connected" : "disconnected";
}

/**
 * Reads the cached feed. Always resolves — on any failure it returns the
 * empty, honest shape rather than throwing, so the page never breaks.
 */
export async function readCachedFeed(): Promise<SocialFeedResponse> {
  const perPlatform = projectConfig.socialFeed.postsPerPlatform;
  const fallback: SocialFeedResponse = {
    instagram: [],
    tiktok: [],
    lastUpdated: null,
    status: {
      instagram: platformStatus(projectConfig.socialFeed.instagramEnabled, false),
      tiktok: platformStatus(projectConfig.socialFeed.tiktokEnabled, false),
    },
  };

  const supabase = publicClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("social_posts")
      .select(
        "id, platform, platform_post_id, account_name, media_type, caption, custom_caption, thumbnail_url, fallback_thumbnail_url, media_url, embed_url, permalink, published_at, duration, width, height, is_featured, is_pinned, is_visible, allow_autoplay, alt_text, last_synced_at, sync_source, approval_status",
      )
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(perPlatform * 6);

    if (error || !data) return fallback;

    const posts = (data as Row[]).map(normalizeRow);
    const pick = (platform: SocialPlatform) =>
      posts.filter((p) => p.platform === platform).slice(0, perPlatform);

    const lastUpdated = posts
      .map((p) => p.lastSyncedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

    return {
      instagram: pick("instagram"),
      tiktok: pick("tiktok"),
      lastUpdated,
      status: fallback.status,
    };
  } catch {
    // Sanitized: never surface raw provider or database errors publicly.
    return fallback;
  }
}
