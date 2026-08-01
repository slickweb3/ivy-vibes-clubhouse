import { createFileRoute } from "@tanstack/react-router";
import { getSiteMedia } from "@/lib/site-media.functions";
import { getMarketSnapshot } from "@/lib/market.functions";
import { getCuratedFeed } from "@/lib/curated.functions";
import { EMPTY_CURATED_FEED, type CuratedFeed } from "@/types/curated";
import type { MarketSnapshot } from "@/lib/market.server";
import { EMPTY_SITE_MEDIA, type SiteMedia } from "@/types/media";
import { SiteNav } from "@/components/ivy/header";
import { BackToTop } from "@/components/ivy/back-to-top";
import { IvyDiscoveries } from "@/components/ivy/discovery";
import { IvySoundscape } from "@/components/ivy/soundscape";
import { faqEntries } from "@/data/site-content";
import { AmbientVibes } from "@/components/ivy/ambient";
import { CookieConsentProvider } from "@/components/ivy/cookie-consent";
import { Hero, MeetIvy, TheLore, WhyIvy, TokenRecord } from "@/components/ivy/sections";
import { SocialWindows } from "@/components/ivy/social-windows";
import { IvyPhotoRow, heroPhotoUrl } from "@/components/ivy/photo-row";
import { LiveMarket } from "@/components/ivy/market";
import { ArcadeTeaser } from "@/components/ivy/arcade-teaser";
import { DailyRibbit } from "@/components/ivy/daily-ribbit";
import { ChorusPond } from "@/components/ivy/chorus-pond";


import { OwnerCorner, RoyalCourt, FAQ, SiteFooter } from "@/components/ivy/sections-b";

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
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/41c25704-61f3-450c-8529-61b43b1e3809/id-preview-7b226fe4--ae92a54f-76f5-4c2b-9762-2e06f523c495.lovable.app-1785391145344.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/41c25704-61f3-450c-8529-61b43b1e3809/id-preview-7b226fe4--ae92a54f-76f5-4c2b-9762-2e06f523c495.lovable.app-1785391145344.png",
      },
    ],
    links: [
      { rel: "canonical", href: "/" },
      // The first frame-by-frame photo is the LCP candidate on the homepage.
      { rel: "preload", as: "image", href: heroPhotoUrl },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: { "@type": "Answer", text: entry.answer },
          })),
        }),
      },
    ],
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
      <AmbientVibes />
      <SiteNav />
      <main id="main">
        <Hero media={media.hero} market={market} />
        <IvyPhotoRow />
        <MeetIvy />
        <DailyRibbit />
        <ChorusPond />



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
      <IvyDiscoveries />
      <IvySoundscape />
      <BackToTop />
    </CookieConsentProvider>
  );
}
