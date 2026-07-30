import { createFileRoute } from "@tanstack/react-router";
import { getSiteMedia } from "@/lib/site-media.functions";
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
import {
  MemeMachine,
  OwnersCorner,
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
  loader: async (): Promise<SiteMedia> => {
    try {
      return await getSiteMedia();
    } catch {
      return EMPTY_SITE_MEDIA;
    }
  },
  component: Home,
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">The clubhouse is catching its breath</h1>
      <p className="mt-3 text-charcoal/80">Please refresh in a moment.</p>
    </main>
  ),
});

function Home() {
  const media = Route.useLoaderData() ?? EMPTY_SITE_MEDIA;
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
        <Hero media={media.hero} />
        <MeetIvy />
        <FreshFromTheFrogQueen media={media} />
        <IvyTV items={media.ivyTv} />
        <HallOfFame items={media.hallOfFame} />
        <TheLore />
        <WhyIvy />
        <TokenRecord />
        <MemeMachine items={media.memeMachine} />
        <OwnersCorner />
        <RoyalCourt />
        <FAQ />
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}
