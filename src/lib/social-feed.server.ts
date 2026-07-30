/**
 * Server-only social feed reader (legacy `/api/social-feed` contract).
 *
 * IMPORTANT: this module reads ONLY from this project's own database, through
 * the same unified approved-media model the website uses. It never calls
 * Instagram or TikTok. Live platform calls happen exclusively in the sync job.
 */
import type {
  PlatformStatus,
  SocialFeedResponse,
  SocialPlatform,
  SocialPost,
} from "@/types/social";
import type { UnifiedMediaItem } from "@/types/media";

export function toSocialPost(item: UnifiedMediaItem): SocialPost {
  return {
    id: item.sourceId,
    platform: (item.platform ?? "instagram") as SocialPlatform,
    platformPostId: item.platformPostId,
    accountName: item.accountName,
    mediaType: item.mediaKind,
    caption: item.originalCaption,
    customCaption: item.websiteCaption,
    thumbnailUrl: item.thumbnailUrl,
    fallbackThumbnailUrl: item.fallbackThumbnailUrl,
    mediaUrl: item.mediaUrl,
    embedUrl: item.embedUrl,
    permalink: item.permalink,
    publishedAt: item.publishedAt,
    duration: item.durationSeconds,
    width: item.width,
    height: item.height,
    isFeatured: item.isFeatured,
    isPinned: item.isPinned,
    isVisible: true,
    allowAutoplay: item.allowAutoplay,
    altText: item.altText,
    lastSyncedAt: item.approvedAt,
    syncSource: item.sourceType === "social" ? "api" : "manual",
    approvalStatus: "approved",
  };
}

function toPlatformStatus(status: string): PlatformStatus {
  return status === "connected" || status === "expired" || status === "error"
    ? (status as PlatformStatus)
    : "disconnected";
}

/**
 * Reads the cached feed. Always resolves — on any failure it returns the
 * empty, honest shape rather than throwing, so the page never breaks.
 */
export async function readCachedFeed(): Promise<SocialFeedResponse> {
  const { readSiteMedia } = await import("./media-read.server");
  const media = await readSiteMedia();

  return {
    instagram: media.freshPosts.instagram.map(toSocialPost),
    tiktok: media.freshPosts.tiktok.map(toSocialPost),
    lastUpdated: media.lastUpdated,
    status: {
      instagram: toPlatformStatus(media.connections.instagram.status),
      tiktok: toPlatformStatus(media.connections.tiktok.status),
    },
  };
}
