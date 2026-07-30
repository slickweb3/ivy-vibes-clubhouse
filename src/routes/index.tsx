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

const TITLE = "IvyVibing — $IVY, the Short Spine Queen's clubhouse";
const DESCRIPTION =
  "Short spine, big vibes. The official IvyVibing clubhouse for $IVY, the community meme coin inspired by Ivy, the Short Spine Queen and Frog Queen.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
