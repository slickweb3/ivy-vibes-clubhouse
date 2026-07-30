import { createFileRoute } from "@tanstack/react-router";
import { getSiteMedia } from "@/lib/site-media.functions";
import { getMarketSnapshot } from "@/lib/market.functions";
import { getCuratedFeed } from "@/lib/curated.functions";
import { EMPTY_CURATED_FEED, type CuratedFeed } from "@/types/curated";
import type { MarketSnapshot } from "@/lib/market.server";
import { EMPTY_SITE_MEDIA, type SiteMedia } from "@/types/media";
import { SiteNav } from "@/components/ivy/header";
import { CookieConsentProvider } from "@/components/ivy/cookie-consent";
import {
  Hero,
  MeetIvy,
  FreshFromTheFrogQueen,
  IvyTV,
  HallOfFame,
  TheLore,
  WhyIvy,
  TokenRecord,
} from "@/components/ivy/sections";
import { LiveMarket } from "@/components/ivy/market";
import {
  MemeMachine,
  OwnerCorner,
  RoyalCourt,
  FAQ,
  SiteFooter,
} from "@/components/ivy/sections-b";

const TITLE = "$IVY — The Official IvyVibing Meme Coin";
const DESCRIPTION =
  "Meet Ivy, the internet's Short Spine Queen and Frog Queen. Explore her story, watch official Ivy videos and follow the upcoming $IVY community project.";

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

function Home() {
  const data = Route.useLoaderData();
  const media = data?.media ?? EMPTY_SITE_MEDIA;
  const market = data?.market ?? null;
  const curated = data?.curated ?? EMPTY_CURATED_FEED;
  return (
    <CookieConsentProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-full focus:bg-frog focus:px-4 focus:py-2 focus:font-display"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Hero media={media.hero} market={market} curatedHero={curated.hero} />
        <MeetIvy curated={curated.hallOfFame.slice(0, 3)} />
        <FreshFromTheFrogQueen media={media} curated={curated.freshPosts} />
        <IvyTV items={media.ivyTv} curated={curated.ivyTv} />
        <HallOfFame items={media.hallOfFame} curated={curated.hallOfFame} />
        <TheLore />
        <WhyIvy />
        <TokenRecord market={market ?? undefined} />
        {market ? <LiveMarket snapshot={market} /> : null}
        <MemeMachine items={media.memeMachine} />
        <OwnerCorner />
        <RoyalCourt />
        <FAQ />
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}
