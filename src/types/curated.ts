/**
 * Curated official social posts.
 *
 * This model stores ONLY public post links and the platform's own official
 * embed URL. It never stores captions, images, thumbnails, audio or video.
 * Ivy's original captions stay inside the official Instagram / TikTok embed,
 * hosted by the platform. `adminLabel` is website-only navigation copy and is
 * never presented as Ivy's caption.
 */

export type CuratedPlatform = "instagram" | "tiktok";
export type CuratedPlacement = "hero" | "fresh_posts" | "ivy_tv" | "hall_of_fame";

export const CURATED_PLACEMENTS: CuratedPlacement[] = [
  "hero",
  "fresh_posts",
  "ivy_tv",
  "hall_of_fame",
];

export const CURATED_PLACEMENT_LABELS: Record<CuratedPlacement, string> = {
  hero: "Hero",
  fresh_posts: "Fresh Posts",
  ivy_tv: "Ivy TV",
  hall_of_fame: "Hall of Fame",
};

export interface CuratedPost {
  id: string;
  platform: CuratedPlatform;
  originalPostUrl: string;
  platformPostId: string;
  officialEmbedUrl: string;
  /** Website-only internal label. Never Ivy's original caption. */
  adminLabel: string | null;
  placements: CuratedPlacement[];
  isVisible: boolean;
  isActive: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  displayOrder: number;
  sourceAccountHandle: string;
  sourceAccountUrl: string;
}

export interface CuratedFeed {
  all: CuratedPost[];
  hero: CuratedPost | null;
  freshPosts: CuratedPost[];
  ivyTv: CuratedPost[];
  hallOfFame: CuratedPost[];
  count: number;
}

export const EMPTY_CURATED_FEED: CuratedFeed = {
  all: [],
  hero: null,
  freshPosts: [],
  ivyTv: [],
  hallOfFame: [],
  count: 0,
};

export const OFFICIAL_HANDLES: Record<CuratedPlatform, { handle: string; url: string }> = {
  instagram: { handle: "frogqueenivy", url: "https://www.instagram.com/frogqueenivy/" },
  tiktok: { handle: "ivyvibing", url: "https://www.tiktok.com/@ivyvibing" },
};

export interface ParsedCuratedUrl {
  platform: CuratedPlatform;
  platformPostId: string;
  originalPostUrl: string;
  officialEmbedUrl: string;
  sourceAccountHandle: string;
  sourceAccountUrl: string;
}

export function instagramEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/embed/`;
}

export function tiktokEmbedUrl(videoId: string): string {
  return `https://www.tiktok.com/player/v1/${videoId}?description=1&music_info=1&autoplay=0&rel=0`;
}

/**
 * Validates a public Instagram/TikTok post URL and derives the official embed
 * URL. Hostname, path shape and account handle are all checked — nothing is
 * fetched from the platform.
 */
export function parseCuratedUrl(input: string): ParsedCuratedUrl | { error: string } {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { error: "Enter a full post URL starting with https://" };
  }
  if (url.protocol !== "https:") return { error: "The URL must start with https://" };

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "instagram.com") {
    const match = url.pathname.match(/^\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)\/?/);
    if (!match) return { error: "Expected an instagram.com/p/… or /reel/… post URL" };
    const shortcode = match[1];
    return {
      platform: "instagram",
      platformPostId: shortcode,
      originalPostUrl: `https://www.instagram.com/p/${shortcode}/`,
      officialEmbedUrl: instagramEmbedUrl(shortcode),
      sourceAccountHandle: OFFICIAL_HANDLES.instagram.handle,
      sourceAccountUrl: OFFICIAL_HANDLES.instagram.url,
    };
  }

  if (host === "tiktok.com") {
    const match = url.pathname.match(/^\/@([A-Za-z0-9._]+)\/video\/(\d+)\/?$/);
    if (!match) return { error: "Expected a tiktok.com/@handle/video/… post URL" };
    const [, handle, videoId] = match;
    if (handle.toLowerCase() !== OFFICIAL_HANDLES.tiktok.handle) {
      return { error: `Only posts from @${OFFICIAL_HANDLES.tiktok.handle} can be curated` };
    }
    return {
      platform: "tiktok",
      platformPostId: videoId,
      originalPostUrl: `https://www.tiktok.com/@${handle}/video/${videoId}`,
      officialEmbedUrl: tiktokEmbedUrl(videoId),
      sourceAccountHandle: handle,
      sourceAccountUrl: `https://www.tiktok.com/@${handle}`,
    };
  }

  return { error: "Only instagram.com and tiktok.com post URLs are supported" };
}

export function platformLabel(platform: CuratedPlatform): string {
  return platform === "instagram" ? "Instagram" : "TikTok";
}

/** Website-only fallback copy. Never claims to be Ivy's caption. */
export function curatedFallbackLabel(post: CuratedPost): string {
  return post.adminLabel ?? `Official ${platformLabel(post.platform)} post`;
}
