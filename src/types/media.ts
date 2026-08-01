/**
 * Unified approved-media model.
 *
 * ONE read model powers Hero, Fresh Posts, Ivy TV, Hall of Fame and the Meme
 * Machine. It combines owner uploads (`media_items`) and imported official
 * social posts (`social_posts`) without duplicating rows across tables.
 *
 * Ivy's ORIGINAL caption is always preserved verbatim in `originalCaption`.
 * `websiteCaption` is an optional website-only override and never replaces it.
 */

export type MediaSource = "upload" | "social";
export type MediaKind = "image" | "video" | "carousel" | "reel";
export type Placement = "hero" | "fresh_posts" | "ivy_tv" | "hall_of_fame" | "meme_machine";

export const PLACEMENTS: Placement[] = [
  "hero",
  "fresh_posts",
  "ivy_tv",
  "hall_of_fame",
  "meme_machine",
];

export const PLACEMENT_LABELS: Record<Placement, string> = {
  hero: "Hero",
  fresh_posts: "Fresh Posts",
  ivy_tv: "Ivy TV",
  hall_of_fame: "Hall of Fame",
  meme_machine: "Meme Machine",
};

export interface UnifiedMediaItem {
  /** Deterministic key: `${sourceType}:${sourceId}`. Stable across syncs. */
  key: string;
  sourceType: MediaSource;
  sourceId: string;
  platform: "instagram" | "tiktok" | null;
  platformPostId: string | null;
  sourceAccountId: string | null;
  accountName: string | null;
  mediaKind: MediaKind;
  /** Ivy's original caption, verbatim. Never rewritten. */
  originalCaption: string | null;
  /** Optional website-only copy. Display copy still prefers the original. */
  websiteCaption: string | null;
  hashtags: string[];
  thumbnailUrl: string | null;
  fallbackThumbnailUrl: string | null;
  mediaUrl: string | null;
  embedUrl: string | null;
  permalink: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  altText: string;
  isFeatured: boolean;
  isPinned: boolean;
  allowAutoplay: boolean;
  allowCommunityReuse: boolean;
  displayOrder: number;
  approvedAt: string | null;
  placements: Placement[];
}

/** Everything the public website needs, in one payload. */
export interface SiteMedia {
  hero: UnifiedMediaItem | null;
  freshPosts: { instagram: UnifiedMediaItem[]; tiktok: UnifiedMediaItem[] };
  ivyTv: UnifiedMediaItem[];
  hallOfFame: UnifiedMediaItem[];
  memeMachine: UnifiedMediaItem[];
  lastUpdated: string | null;
  connections: {
    instagram: ConnectionSummary;
    tiktok: ConnectionSummary;
  };
}

export interface ConnectionSummary {
  /** Honest: `connected` only after a real OAuth handshake succeeded. */
  status: "connected" | "disconnected" | "expired" | "error";
  accountName: string | null;
  lastSyncAt: string | null;
}

export const EMPTY_SITE_MEDIA: SiteMedia = {
  hero: null,
  freshPosts: { instagram: [], tiktok: [] },
  ivyTv: [],
  hallOfFame: [],
  memeMachine: [],
  lastUpdated: null,
  connections: {
    instagram: { status: "disconnected", accountName: null, lastSyncAt: null },
    tiktok: { status: "disconnected", accountName: null, lastSyncAt: null },
  },
};

/** Primary display copy: Ivy's own words first, website override second. */
export function displayCaption(item: UnifiedMediaItem): string {
  return item.originalCaption ?? item.websiteCaption ?? "";
}

export function posterUrl(item: UnifiedMediaItem): string | null {
  return item.thumbnailUrl ?? item.fallbackThumbnailUrl ?? null;
}

export function isVideoLike(item: UnifiedMediaItem): boolean {
  return item.mediaKind === "video" || item.mediaKind === "reel";
}

/** Default placement rules. Manual placements always win over these. */
export function defaultPlacements(kind: MediaKind): Placement[] {
  return isVideoKind(kind) ? ["fresh_posts", "ivy_tv"] : ["fresh_posts", "hall_of_fame"];
}

export function isVideoKind(kind: MediaKind): boolean {
  return kind === "video" || kind === "reel";
}
