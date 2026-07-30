/**
 * Normalized social post + media models.
 *
 * Every source (Instagram, TikTok, manual entry) is mapped into this single
 * shape before it reaches the UI or the public API.
 */

export type SocialPlatform = "instagram" | "tiktok" | "manual";
export type MediaKind = "image" | "video" | "carousel" | "placeholder";

export interface SocialMedia {
  id: string;
  kind: MediaKind;
  /** Owner-approved asset URL. `null` renders a labelled placeholder. */
  url: string | null;
  thumbnailUrl: string | null;
  altText: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  /** ID on the source platform, when synced. */
  externalId: string | null;
  permalink: string | null;
  caption: string;
  postedAt: string | null;
  media: SocialMedia[];
  likeCount: number | null;
  commentCount: number | null;
  /** true when this entry is an owner-curated fallback, not a live sync. */
  isFallback: boolean;
}

export interface SocialFeedResponse {
  posts: SocialPost[];
  source: "database" | "cache" | "fallback";
  lastSyncedAt: string | null;
  live: boolean;
  notice: string;
}

function placeholderMedia(id: string, altText: string, kind: MediaKind = "placeholder"): SocialMedia {
  return {
    id,
    kind,
    url: null,
    thumbnailUrl: null,
    altText,
    width: null,
    height: null,
    durationSeconds: null,
  };
}

/**
 * Manual fallback feed — owner-curated copy only, no invented metrics,
 * no invented handles, no stock dog imagery.
 */
export const manualFallbackFeed: SocialPost[] = [
  {
    id: "fallback-1",
    platform: "manual",
    externalId: null,
    permalink: null,
    caption: "Slot reserved for Ivy's latest post. Owner-approved media pending.",
    postedAt: null,
    media: [placeholderMedia("fallback-1-m", "Reserved slot for an owner-approved photo of Ivy")],
    likeCount: null,
    commentCount: null,
    isFallback: true,
  },
  {
    id: "fallback-2",
    platform: "manual",
    externalId: null,
    permalink: null,
    caption: "Frog Queen sits. Frog Queen judges. Media slot awaiting upload.",
    postedAt: null,
    media: [placeholderMedia("fallback-2-m", "Reserved slot for an owner-approved frog-sit photo of Ivy")],
    likeCount: null,
    commentCount: null,
    isFallback: true,
  },
  {
    id: "fallback-3",
    platform: "manual",
    externalId: null,
    permalink: null,
    caption: "Short spine, long stretch. Clip slot awaiting upload.",
    postedAt: null,
    media: [placeholderMedia("fallback-3-m", "Reserved slot for an owner-approved clip of Ivy", "video")],
    likeCount: null,
    commentCount: null,
    isFallback: true,
  },
  {
    id: "fallback-4",
    platform: "manual",
    externalId: null,
    permalink: null,
    caption: "Community repost slot. Credit goes to the original creator once approved.",
    postedAt: null,
    media: [placeholderMedia("fallback-4-m", "Reserved slot for an owner-approved community repost")],
    likeCount: null,
    commentCount: null,
    isFallback: true,
  },
  {
    id: "fallback-5",
    platform: "manual",
    externalId: null,
    permalink: null,
    caption: "Sunbeam patrol, daily duty. Photo slot awaiting upload.",
    postedAt: null,
    media: [placeholderMedia("fallback-5-m", "Reserved slot for an owner-approved sunbathing photo of Ivy")],
    likeCount: null,
    commentCount: null,
    isFallback: true,
  },
  {
    id: "fallback-6",
    platform: "manual",
    externalId: null,
    permalink: null,
    caption: "Royal Court roll call. Group photo slot awaiting upload.",
    postedAt: null,
    media: [placeholderMedia("fallback-6-m", "Reserved slot for an owner-approved group photo")],
    likeCount: null,
    commentCount: null,
    isFallback: true,
  },
];

/**
 * Local cache stand-in. Replace with a database read once Lovable Cloud is
 * configured — the public API must never call a social platform directly.
 */
export function readCachedFeed(): SocialFeedResponse {
  return {
    posts: manualFallbackFeed,
    source: "fallback",
    lastSyncedAt: null,
    live: false,
    notice:
      "No social connection is configured. Showing the owner-curated fallback feed from local cache.",
  };
}
