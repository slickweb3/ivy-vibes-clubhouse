/**
 * Server-only unified approved-media reader.
 *
 * Reads ONLY from this project's own database (the `unified_media` view plus
 * `media_placements`). It never calls Instagram or TikTok — live platform
 * calls happen exclusively in the sync job.
 */
import { createClient } from "@supabase/supabase-js";
import {
  EMPTY_SITE_MEDIA,
  defaultPlacements,
  isVideoKind,
  type ConnectionSummary,
  type MediaKind,
  type Placement,
  type SiteMedia,
  type UnifiedMediaItem,
} from "@/types/media";
import { projectConfig } from "@/config/project";

type Row = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);
const num = (v: unknown) => (typeof v === "number" ? v : null);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);

/** Publishable-key client. RLS keeps this to approved + visible + active rows. */
export function publicClient() {
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

export function normalizeUnifiedRow(row: Row, placements: Placement[]): UnifiedMediaItem {
  const sourceType = (row.source_type as UnifiedMediaItem["sourceType"]) ?? "upload";
  const sourceId = String(row.source_id ?? "");
  const mediaKind = ((row.media_kind as MediaKind) ?? "image") as MediaKind;

  return {
    key: `${sourceType}:${sourceId}`,
    sourceType,
    sourceId,
    platform: (str(row.platform) as UnifiedMediaItem["platform"]) ?? null,
    platformPostId: str(row.platform_post_id),
    sourceAccountId: str(row.source_account_id),
    accountName: str(row.account_name),
    mediaKind,
    originalCaption: str(row.original_caption),
    websiteCaption: str(row.website_caption),
    hashtags: Array.isArray(row.hashtags) ? (row.hashtags as string[]) : [],
    thumbnailUrl: str(row.thumbnail_url),
    fallbackThumbnailUrl: str(row.fallback_thumbnail_url),
    mediaUrl: str(row.media_url),
    embedUrl: str(row.embed_url),
    permalink: str(row.permalink),
    publishedAt: str(row.published_at),
    durationSeconds: num(row.duration_seconds),
    width: num(row.width),
    height: num(row.height),
    altText: typeof row.alt_text === "string" ? row.alt_text : "",
    isFeatured: bool(row.is_featured),
    isPinned: bool(row.is_pinned),
    allowAutoplay: bool(row.allow_autoplay),
    allowCommunityReuse: bool(row.allow_community_reuse),
    displayOrder: num(row.display_order) ?? 0,
    approvedAt: str(row.approved_at),
    placements: placements.length > 0 ? placements : defaultPlacements(mediaKind),
  };
}

const SELECT_COLUMNS =
  "source_type, source_id, platform, platform_post_id, source_account_id, account_name, media_kind, original_caption, website_caption, hashtags, thumbnail_url, fallback_thumbnail_url, media_url, embed_url, permalink, published_at, duration_seconds, width, height, alt_text, is_featured, is_pinned, allow_autoplay, allow_community_reuse, display_order, approved_at, updated_at";

function byRecency(a: UnifiedMediaItem, b: UnifiedMediaItem): number {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  return bt - at;
}

/** Everything the public site renders, resolved from one query set. */
export async function readSiteMedia(): Promise<SiteMedia> {
  const supabase = publicClient();
  if (!supabase) return EMPTY_SITE_MEDIA;

  try {
    const [mediaRes, placementRes, connectionRes] = await Promise.all([
      supabase.from("unified_media").select(SELECT_COLUMNS).limit(300),
      supabase.from("media_placements").select("source_type, source_id, placement").limit(1500),
      supabase
        .from("social_connections")
        .select("platform, account_name, is_connected, last_sync_at, token_expires_at")
        .limit(10),
    ]);

    if (mediaRes.error || !mediaRes.data) return EMPTY_SITE_MEDIA;

    const placementMap = new Map<string, Placement[]>();
    for (const row of (placementRes.data ?? []) as Row[]) {
      const key = `${row.source_type}:${row.source_id}`;
      const list = placementMap.get(key) ?? [];
      list.push(row.placement as Placement);
      placementMap.set(key, list);
    }

    const items = (mediaRes.data as Row[])
      .map((row) => {
        const key = `${row.source_type}:${row.source_id}`;
        return normalizeUnifiedRow(row, placementMap.get(key) ?? []);
      })
      .sort(byRecency);

    const inPlacement = (placement: Placement) =>
      items.filter((item) => item.placements.includes(placement));

    const perPlatform = projectConfig.socialFeed.postsPerPlatform;
    const fresh = inPlacement("fresh_posts");

    // Hero: an owner-pinned image wins; otherwise the newest suitable approved image.
    const heroCandidates = items.filter((item) => !isVideoKind(item.mediaKind));
    const hero =
      items.find((item) => item.placements.includes("hero") && item.isPinned) ??
      items.find((item) => item.placements.includes("hero")) ??
      heroCandidates[0] ??
      null;

    const connections = readConnections((connectionRes.data ?? []) as Row[]);

    const lastUpdated =
      (mediaRes.data as Row[])
        .map((row) => str(row.updated_at))
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

    return {
      hero,
      freshPosts: {
        instagram: fresh.filter((i) => i.platform === "instagram").slice(0, perPlatform),
        tiktok: fresh.filter((i) => i.platform === "tiktok").slice(0, perPlatform),
      },
      ivyTv: inPlacement("ivy_tv"),
      hallOfFame: inPlacement("hall_of_fame"),
      // Community reuse is opt-in only.
      memeMachine: inPlacement("meme_machine").filter((item) => item.allowCommunityReuse),
      lastUpdated,
      connections,
    };
  } catch {
    // Sanitized: never surface raw provider or database errors publicly.
    return EMPTY_SITE_MEDIA;
  }
}

function readConnections(rows: Row[]): SiteMedia["connections"] {
  const summary = (platform: "instagram" | "tiktok"): ConnectionSummary => {
    const row = rows.find((r) => r.platform === platform);
    if (!row || !bool(row.is_connected)) {
      return { status: "disconnected", accountName: null, lastSyncAt: null };
    }
    const expires = str(row.token_expires_at);
    const expired = expires ? Date.parse(expires) < Date.now() : false;
    return {
      status: expired ? "expired" : "connected",
      accountName: str(row.account_name),
      lastSyncAt: str(row.last_sync_at),
    };
  };

  return { instagram: summary("instagram"), tiktok: summary("tiktok") };
}
