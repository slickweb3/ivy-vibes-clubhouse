import { createFileRoute } from "@tanstack/react-router";
import { getSiteMedia } from "@/lib/site-media.functions";
import { getMarketSnapshot } from "@/lib/market.functions";
import { getCuratedFeed } from "@/lib/curated.functions";
import { EMPTY_CURATED_FEED, type CuratedFeed, type CuratedPost } from "@/types/curated";
import type { MarketSnapshot } from "@/lib/market.server";
import { EMPTY_SITE_MEDIA, type SiteMedia } from "@/types/media";
import { SiteNav } from "@/components/ivy/header";
import { AmbientVibes } from "@/components/ivy/ambient";
import { CookieConsentProvider } from "@/components/ivy/cookie-consent";
import {
  Hero,
  MeetIvy,
  TheLore,
  WhyIvy,
  TokenRecord,
} from "@/components/ivy/sections";
import { SocialWindows } from "@/components/ivy/social-windows";
import { IvyPhotoRow } from "@/components/ivy/photo-row";
import { LiveMarket } from "@/components/ivy/market";
import { ArcadeTeaser } from "@/components/ivy/arcade-teaser";
import {
  OwnerCorner,
  RoyalCourt,
  FAQ,
  SiteFooter,
} from "@/components/ivy/sections-b";

const TITLE = "$ivy — The Official ivy vibing Meme Coin";
const DESCRIPTION =
  "Meet Ivy, the internet's Short Spine Queen and Frog Queen. Explore her story, watch official Ivy videos and follow the upcoming $ivy community project.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  // Public read model: approved + visible + active items only.
  loader: async (): Promise<HomeData> => {
    const [media, market, curated] = await Promise.all([
      getSiteMedia().catch(() => EMPTY_SITE_MEDIA),
      getMarketSnapshot().catch(() => null),
      getCuratedFeed().catch(() => EMPTY_CURATED_FEED),
    ]);
    return { media, market, curated };
  },
  component: Home,
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">The clubhouse is catching its breath</h1>
      <p className="mt-3 text-charcoal/80">Please refresh in a moment.</p>
    </main>
  ),
});

interface HomeData {
  media: SiteMedia;
  market: MarketSnapshot | null;
  curated: CuratedFeed;
}

interface HomeCuratedSections {
  hero: CuratedPost | null;
  freshPosts: CuratedPost[];
}

function buildHomeCuratedSections(feed: CuratedFeed): HomeCuratedSections {
  const used = new Set<string>();
  const isInstagramPhoto = (post: CuratedPost) =>
    post.platform === "instagram" && post.originalPostUrl.includes("/p/");
  const isVideoPost = (post: CuratedPost) =>
    post.platform === "tiktok" || post.originalPostUrl.includes("/reel/");
  const sortPinned = (posts: CuratedPost[]) =>
    [...posts].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.displayOrder - b.displayOrder;
    });
  const take = (posts: CuratedPost[], limit: number) => {
    const picked: CuratedPost[] = [];
    for (const post of posts) {
      if (used.has(post.id)) continue;
      picked.push(post);
      used.add(post.id);
      if (picked.length >= limit) break;
    }
    return picked;
  };

  const photoPosts = sortPinned(feed.all.filter(isInstagramPhoto));
  const videoPosts = sortPinned(feed.all.filter(isVideoPost));
  const hero =
    (feed.hero && isInstagramPhoto(feed.hero) ? feed.hero : null) ??
    photoPosts.find((post) => post.placements.includes("hero")) ??
    photoPosts[0] ??
    null;

  if (hero) used.add(hero.id);

  const freshPhotoPosts = take(photoPosts, 2);
  const freshVideoPosts = take(videoPosts, 4);
  const freshPosts = [...freshPhotoPosts, ...freshVideoPosts];

  return { hero, freshPosts };

}

function Home() {
  const data = Route.useLoaderData();
  const media = data?.media ?? EMPTY_SITE_MEDIA;
  const market = data?.market ?? null;
  const curated = data?.curated ?? EMPTY_CURATED_FEED;
  const homeCurated = buildHomeCuratedSections(curated);
  return (
    <CookieConsentProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-full focus:bg-frog focus:px-4 focus:py-2 focus:font-display"
      >
        Skip to content
      </a>
      <AmbientVibes />
      <SiteNav />
      <main id="main">
        <Hero media={media.hero} market={market} curatedHero={homeCurated.hero} />
        <IvyPhotoRow />
        <MeetIvy />

        <SocialWindows posts={curated.all} />
        <TheLore />
        <WhyIvy />
        <TokenRecord market={market ?? undefined} />
        {market ? <LiveMarket snapshot={market} /> : null}
        <ArcadeTeaser />
        <OwnerCorner />
        <RoyalCourt />
        <FAQ />
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}
