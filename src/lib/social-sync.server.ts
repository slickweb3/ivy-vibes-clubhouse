/**
 * Scheduled + manual social synchronization.
 *
 * SCHEDULE: roughly every 12 hours (`projectConfig.socialFeed.syncIntervalHours`),
 * triggered by pg_cron calling POST /api/public/hooks/social-sync with the
 * shared SOCIAL_SYNC_SECRET header. Also runs immediately after a successful
 * OAuth handshake and on the admin "Refresh Now" action.
 *
 * ALGORITHM (per platform)
 *  1. Guard: skip unless credentials exist AND a stored connection with a
 *     usable token exists. Never pretend a platform is connected.
 *  2. Fetch the newest items from the OFFICIAL API only. Never scrape.
 *  3. Normalize; keep the original caption verbatim.
 *  4. Dedupe on the natural key (platform, platform_post_id).
 *  5. Sort by original publication time, newest first.
 *  6. Upsert, PRESERVING administrator overrides: custom_caption, alt_text,
 *     is_visible, is_pinned, is_featured, allow_autoplay, allow_community_reuse,
 *     fallback_thumbnail_url and approval_status are never overwritten.
 *  7. Auto-publish: only when the post's source account id equals the exact
 *     verified connected external account id, auto-publish is enabled and the
 *     emergency pause is off.
 *  8. Auto-categorize default placements (videos/reels -> Fresh Posts + Ivy TV,
 *     images/carousels -> Fresh Posts + Hall of Fame).
 *  9. Items no longer returned upstream are marked inactive, never deleted.
 * 10. Record a sanitized `sync_runs` row. On failure, the last successful
 *     visible feed is retained — the public feed never goes blank.
 *
 * Raw tokens are never written to `social_connections` and never logged.
 */
import type { SocialPlatform } from "@/types/social";
import { defaultPlacements, type MediaKind } from "@/types/media";
import { loadAccessToken, providerStatus } from "./social-oauth.server";

export interface SyncOutcome {
  platform: SocialPlatform;
  status: "skipped" | "ok" | "failed";
  reason: string;
  itemsFetched: number;
  itemsUpserted: number;
  itemsMarkedUnavailable: number;
  itemsAutoPublished: number;
}

/** Fields the sync must never overwrite once an administrator has set them. */
export const ADMIN_OVERRIDE_FIELDS = [
  "custom_caption",
  "alt_text",
  "is_visible",
  "is_pinned",
  "is_featured",
  "allow_autoplay",
  "allow_community_reuse",
  "fallback_thumbnail_url",
  "approval_status",
] as const;

export interface NormalizedPost {
  platform: SocialPlatform;
  platformPostId: string;
  sourceAccountId: string | null;
  accountName: string | null;
  mediaType: MediaKind;
  caption: string | null;
  hashtags: string[];
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  embedUrl: string | null;
  permalink: string | null;
  publishedAt: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
}

export function extractHashtags(caption: string | null): string[] {
  if (!caption) return [];
  return [...caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((match) => match[1]);
}

/** Dedupe + ordering used before any write. */
export function dedupeAndSort(posts: NormalizedPost[]): NormalizedPost[] {
  const byKey = new Map<string, NormalizedPost>();
  for (const post of posts) {
    byKey.set(`${post.platform}:${post.platformPostId}`, post);
  }
  return [...byKey.values()].sort((a, b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bt - at;
  });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

interface AutomationSettings {
  autoPublishVerifiedPosts: boolean;
  autoCategorizeVerifiedPosts: boolean;
  defaultCommunityReuse: boolean;
  automationPaused: boolean;
}

export async function readAutomationSettings(): Promise<AutomationSettings> {
  const db = await admin();
  const { data } = await db
    .from("project_config")
    .select(
      "auto_publish_verified_posts, auto_categorize_verified_posts, default_community_reuse, automation_paused",
    )
    .limit(1)
    .maybeSingle();
  const row = (data ?? {}) as Record<string, boolean | undefined>;
  return {
    autoPublishVerifiedPosts: row.auto_publish_verified_posts ?? true,
    autoCategorizeVerifiedPosts: row.auto_categorize_verified_posts ?? true,
    defaultCommunityReuse: row.default_community_reuse ?? false,
    automationPaused: row.automation_paused ?? true,
  };
}

/* -------------------------------------------------------- provider reads */

async function fetchInstagram(token: string): Promise<NormalizedPost[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,owner";
  const res = await fetch(
    `https://graph.instagram.com/v21.0/me/media?fields=${fields}&limit=25&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) throw new Error("upstream_unavailable");
  const json = (await res.json()) as {
    data?: Array<Record<string, unknown>>;
  };

  return (json.data ?? []).map((item) => {
    const type = String(item.media_type ?? "IMAGE");
    const mediaType: MediaKind =
      type === "VIDEO" ? "video" : type === "CAROUSEL_ALBUM" ? "carousel" : "image";
    const caption = typeof item.caption === "string" ? item.caption : null;
    return {
      platform: "instagram" as const,
      platformPostId: String(item.id),
      sourceAccountId:
        typeof item.owner === "object" && item.owner !== null
          ? String((item.owner as { id?: string }).id ?? "")
          : null,
      accountName: typeof item.username === "string" ? item.username : null,
      mediaType,
      caption,
      hashtags: extractHashtags(caption),
      thumbnailUrl:
        (typeof item.thumbnail_url === "string" ? item.thumbnail_url : null) ??
        (mediaType === "image" && typeof item.media_url === "string" ? item.media_url : null),
      mediaUrl: typeof item.media_url === "string" ? item.media_url : null,
      embedUrl: typeof item.permalink === "string" ? `${item.permalink}embed` : null,
      permalink: typeof item.permalink === "string" ? item.permalink : null,
      publishedAt: typeof item.timestamp === "string" ? item.timestamp : null,
      duration: null,
      width: null,
      height: null,
    };
  });
}

async function fetchTikTok(token: string): Promise<NormalizedPost[]> {
  const fields =
    "id,title,video_description,cover_image_url,embed_link,share_url,create_time,duration,width,height";
  const res = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${fields}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ max_count: 20 }),
  });
  if (!res.ok) throw new Error("upstream_unavailable");
  const json = (await res.json()) as {
    data?: { videos?: Array<Record<string, unknown>> };
  };

  return (json.data?.videos ?? []).map((item) => {
    const caption =
      (typeof item.video_description === "string" && item.video_description) ||
      (typeof item.title === "string" ? item.title : null) ||
      null;
    return {
      platform: "tiktok" as const,
      platformPostId: String(item.id),
      sourceAccountId: null,
      accountName: null,
      mediaType: "video" as MediaKind,
      caption,
      hashtags: extractHashtags(caption),
      thumbnailUrl: typeof item.cover_image_url === "string" ? item.cover_image_url : null,
      mediaUrl: null,
      embedUrl: typeof item.embed_link === "string" ? item.embed_link : null,
      permalink: typeof item.share_url === "string" ? item.share_url : null,
      publishedAt:
        typeof item.create_time === "number"
          ? new Date(item.create_time * 1000).toISOString()
          : null,
      duration: typeof item.duration === "number" ? item.duration : null,
      width: typeof item.width === "number" ? item.width : null,
      height: typeof item.height === "number" ? item.height : null,
    };
  });
}

/* --------------------------------------------------------------- syncing */

export async function syncPlatform(platform: SocialPlatform): Promise<SyncOutcome> {
  const base: SyncOutcome = {
    platform,
    status: "skipped",
    reason: "",
    itemsFetched: 0,
    itemsUpserted: 0,
    itemsMarkedUnavailable: 0,
    itemsAutoPublished: 0,
  };

  const status = providerStatus(platform);
  if (!status.configured) {
    return {
      ...base,
      reason: `${platform} credentials are not configured (missing: ${status.missing.join(", ")}).`,
    };
  }

  const db = await admin();
  const { data: connectionRow } = await db
    .from("social_connections")
    .select("is_connected, external_account_id, account_name")
    .eq("platform", platform)
    .maybeSingle();

  const connection = connectionRow as {
    is_connected: boolean;
    external_account_id: string | null;
    account_name: string | null;
  } | null;

  if (!connection?.is_connected) {
    return { ...base, reason: `${platform} has not been authorized by the account owner yet.` };
  }

  const token = await loadAccessToken(platform);
  if (!token) {
    return {
      ...base,
      reason: `${platform} has no stored access token. Re-authorization required.`,
    };
  }

  const startedAt = new Date().toISOString();
  const settings = await readAutomationSettings();

  try {
    const raw = platform === "instagram" ? await fetchInstagram(token) : await fetchTikTok(token);
    const posts = dedupeAndSort(raw).map((post) => ({
      ...post,
      // The connected account is the source of every item this endpoint returns.
      sourceAccountId: post.sourceAccountId ?? connection.external_account_id,
      accountName: post.accountName ?? connection.account_name,
    }));

    const ids = posts.map((post) => post.platformPostId);
    const { data: existingRows } = await db
      .from("social_posts")
      .select("id, platform_post_id, approval_status")
      .eq("platform", platform);

    const existing = new Map(
      (
        (existingRows ?? []) as Array<{
          id: string;
          platform_post_id: string;
          approval_status: string;
        }>
      ).map((row) => [row.platform_post_id, row]),
    );

    let upserted = 0;
    let autoPublished = 0;

    for (const post of posts) {
      const verified =
        Boolean(connection.external_account_id) &&
        post.sourceAccountId === connection.external_account_id;
      const mayAutoPublish =
        verified && settings.autoPublishVerifiedPosts && !settings.automationPaused;

      // Fields refreshed from the platform on every sync.
      const platformFields = {
        platform,
        platform_post_id: post.platformPostId,
        source_account_id: post.sourceAccountId,
        account_name: post.accountName,
        media_type: post.mediaType,
        caption: post.caption, // Ivy's original caption, verbatim.
        hashtags: post.hashtags,
        thumbnail_url: post.thumbnailUrl,
        media_url: post.mediaUrl,
        embed_url: post.embedUrl,
        permalink: post.permalink,
        published_at: post.publishedAt,
        duration: post.duration,
        width: post.width,
        height: post.height,
        is_active: true,
        unavailable_at: null,
        last_synced_at: new Date().toISOString(),
        sync_source: "api" as const,
        updated_at: new Date().toISOString(),
      };

      const known = existing.get(post.platformPostId);

      if (known) {
        // Update platform fields only. Admin overrides are untouched.
        const { error } = await db.from("social_posts").update(platformFields).eq("id", known.id);
        if (!error) upserted += 1;
        continue;
      }

      const { data: inserted, error } = await db
        .from("social_posts")
        .insert({
          ...platformFields,
          approval_status: mayAutoPublish ? "approved" : "pending",
          is_visible: mayAutoPublish,
          approved_at: mayAutoPublish ? new Date().toISOString() : null,
          approval_source: mayAutoPublish
            ? `auto:verified_account:${connection.external_account_id}`
            : "pending:unverified_account",
          allow_community_reuse: settings.defaultCommunityReuse,
          allow_autoplay: false,
          alt_text: "",
        })
        .select("id")
        .maybeSingle();

      if (error || !inserted) continue;
      upserted += 1;
      if (mayAutoPublish) autoPublished += 1;

      if (settings.autoCategorizeVerifiedPosts && verified) {
        const placements = defaultPlacements(post.mediaType).map((placement) => ({
          source_type: "social" as const,
          source_id: (inserted as { id: string }).id,
          placement,
          is_auto: true,
        }));
        await db.from("media_placements").upsert(placements, {
          onConflict: "source_type,source_id,placement",
        });
      }

      await db.from("admin_audit_logs").insert({
        action: mayAutoPublish ? "auto_publish_post" : "import_post_pending",
        entity_type: "social_posts",
        entity_id: (inserted as { id: string }).id,
        summary: mayAutoPublish
          ? `Auto-approved ${platform} post from verified account ${connection.external_account_id}.`
          : `Imported ${platform} post; held for review (account not verified).`,
      });
    }

    // Items no longer returned upstream: mark inactive, never delete.
    let markedUnavailable = 0;
    if (ids.length > 0) {
      const { data: stale } = await db
        .from("social_posts")
        .update({ is_active: false, unavailable_at: new Date().toISOString() })
        .eq("platform", platform)
        .eq("is_active", true)
        .not("platform_post_id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`)
        .select("id");
      markedUnavailable = (stale ?? []).length;
    }

    await db
      .from("social_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_error: null,
      })
      .eq("platform", platform);

    await db.from("sync_runs").insert({
      platform,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "ok",
      items_fetched: posts.length,
      items_upserted: upserted,
      items_marked_unavailable: markedUnavailable,
      message: `Synced ${posts.length} items.`,
    });

    return {
      platform,
      status: "ok",
      reason: "Sync completed.",
      itemsFetched: posts.length,
      itemsUpserted: upserted,
      itemsMarkedUnavailable: markedUnavailable,
      itemsAutoPublished: autoPublished,
    };
  } catch {
    // Sanitized failure. The last successful feed stays exactly as it was.
    await db.from("sync_runs").insert({
      platform,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "failed",
      message: "Upstream request failed. Previous feed retained.",
    });
    await db
      .from("social_connections")
      .update({ last_sync_status: "failed", last_error: "Upstream request failed." })
      .eq("platform", platform);

    return {
      ...base,
      status: "failed",
      reason: "Upstream request failed. The previous approved feed was kept.",
    };
  }
}

export async function runScheduledSync(): Promise<SyncOutcome[]> {
  return Promise.all([syncPlatform("instagram"), syncPlatform("tiktok")]);
}
