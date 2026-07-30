import { createFileRoute } from "@tanstack/react-router";
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
  component: Home,
});

function Home() {
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
        <Hero />
        <MeetIvy />
        <FreshFromTheFrogQueen />
        <IvyTV />
        <HallOfFame />
        <TheLore />
        <WhyIvy />
        <TokenRecord />
        <MemeMachine />
        <OwnersCorner />
        <RoyalCourt />
        <FAQ />
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}
