/**
 * Scheduled social synchronization (design + skeleton).
 *
 * SCHEDULE
 * Runs approximately every 12 hours (see `projectConfig.socialFeed.syncIntervalHours`).
 * Trigger it with pg_cron calling POST /api/public/hooks/social-sync with the
 * shared `SOCIAL_SYNC_SECRET` header.
 *
 * ALGORITHM (per platform)
 *  1. Guard: skip immediately unless the platform is enabled AND credentials
 *     exist AND a stored connection with a valid token reference exists.
 *  2. Fetch the newest N items (N = postsPerPlatform, with a small buffer) from
 *     the official API only. No scraping, ever.
 *  3. Normalize each item into the SocialPost shape.
 *  4. Dedupe on the natural key (platform, platformPostId).
 *  5. Sort by published timestamp, newest first.
 *  6. Upsert into `social_posts`, PRESERVING administrator overrides:
 *     custom_caption, alt_text, is_visible, is_pinned, is_featured,
 *     allow_autoplay, fallback_thumbnail_url and approval_status are never
 *     overwritten by the sync.
 *  7. Any previously-synced post that is no longer returned (deleted, made
 *     private, unsupported) is marked unavailable — is_visible = false — and
 *     is NOT deleted, so history and admin context survive.
 *  8. Refresh expiring metadata: platform CDN thumbnail URLs expire, so the
 *     poster is re-fetched and `fallback_thumbnail_url` is used when the
 *     primary is stale.
 *  9. Record a sanitized `sync_runs` row (counts + short status message only —
 *     never tokens, never raw provider payloads).
 * 10. On failure: log the sanitized failure and RETAIN the last successful
 *     visible feed. The public feed must never go blank because of a sync
 *     error.
 *
 * TOKENS
 * Raw provider access tokens are never written to `social_connections`. That
 * table stores only `token_ref` — an opaque pointer to a server-side secret.
 */
import { providerStatus } from "./social-oauth.server";
import { projectConfig } from "@/config/project";
import type { SocialPlatform, SocialPost } from "@/types/social";

export interface SyncOutcome {
  platform: SocialPlatform;
  status: "skipped" | "ok" | "failed";
  reason: string;
  itemsFetched: number;
  itemsUpserted: number;
  itemsMarkedUnavailable: number;
}

/** Fields the sync must never overwrite once an administrator has set them. */
export const ADMIN_OVERRIDE_FIELDS = [
  "custom_caption",
  "alt_text",
  "is_visible",
  "is_pinned",
  "is_featured",
  "allow_autoplay",
  "fallback_thumbnail_url",
  "approval_status",
] as const;

/** Dedupe + ordering used before any write. */
export function dedupeAndSort(posts: SocialPost[]): SocialPost[] {
  const byKey = new Map<string, SocialPost>();
  for (const post of posts) {
    const key = `${post.platform}:${post.platformPostId ?? post.id}`;
    if (!byKey.has(key)) byKey.set(key, post);
  }
  return [...byKey.values()].sort((a, b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bt - at;
  });
}

function enabledFor(platform: SocialPlatform): boolean {
  return platform === "instagram"
    ? projectConfig.socialFeed.instagramEnabled
    : projectConfig.socialFeed.tiktokEnabled;
}

/**
 * Runs one platform's sync. Currently a guarded stub: without credentials it
 * reports `skipped` honestly instead of pretending to be connected.
 */
export async function syncPlatform(platform: SocialPlatform): Promise<SyncOutcome> {
  const base: SyncOutcome = {
    platform,
    status: "skipped",
    reason: "",
    itemsFetched: 0,
    itemsUpserted: 0,
    itemsMarkedUnavailable: 0,
  };

  if (!enabledFor(platform)) {
    return { ...base, reason: `${platform} sync is disabled in projectConfig.` };
  }

  const status = providerStatus(platform);
  if (!status.configured) {
    return {
      ...base,
      reason: `${platform} credentials are not configured (missing: ${status.missing.join(", ")}).`,
    };
  }

  // Steps 2-9 land here once credentials exist. Implement with the official
  // Instagram Graph API / TikTok Display API clients only.
  return { ...base, reason: `${platform} connection record not established yet.` };
}

export async function runScheduledSync(): Promise<SyncOutcome[]> {
  return Promise.all([syncPlatform("instagram"), syncPlatform("tiktok")]);
}
