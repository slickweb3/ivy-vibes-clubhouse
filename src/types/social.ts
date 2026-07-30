/**
 * Normalized media + social models.
 *
 * Every source (Instagram API, TikTok Display API, manual admin entry) is
 * mapped into these shapes before it reaches the public API or the UI.
 */

export type SocialPlatform = "instagram" | "tiktok";
export type MediaType = "image" | "video" | "carousel" | "reel";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type SyncSource = "manual" | "api";

export interface MediaItem {
  id: string;
  title: string;
  mediaType: MediaType;
  /** Owner-approved asset URL. `null` renders a labelled placeholder slot. */
  url: string | null;
  thumbnailUrl: string | null;
  fallbackThumbnailUrl: string | null;
  altText: string;
  credit: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  approvalStatus: ApprovalStatus;
  isVisible: boolean;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  platformPostId: string | null;
  accountName: string | null;
  mediaType: MediaType;
  caption: string | null;
  /** Website-authored caption which overrides the platform caption. */
  customCaption: string | null;
  thumbnailUrl: string | null;
  fallbackThumbnailUrl: string | null;
  mediaUrl: string | null;
  embedUrl: string | null;
  permalink: string | null;
  publishedAt: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  isFeatured: boolean;
  isPinned: boolean;
  isVisible: boolean;
  allowAutoplay: boolean;
  altText: string;
  lastSyncedAt: string | null;
  syncSource: SyncSource;
  approvalStatus: ApprovalStatus;
}

export type PlatformStatus = "not_configured" | "disconnected" | "connected" | "error";

export interface SocialFeedStatus {
  instagram: PlatformStatus;
  tiktok: PlatformStatus;
}

/** Exact public API contract for GET /api/social-feed. */
export interface SocialFeedResponse {
  instagram: SocialPost[];
  tiktok: SocialPost[];
  lastUpdated: string | null;
  status: SocialFeedStatus;
}

export function emptyFeed(status: SocialFeedStatus): SocialFeedResponse {
  return { instagram: [], tiktok: [], lastUpdated: null, status };
}

export function postCaption(post: SocialPost): string {
  return post.customCaption ?? post.caption ?? "";
}

export function postThumbnail(post: SocialPost): string | null {
  return post.thumbnailUrl ?? post.fallbackThumbnailUrl;
}
