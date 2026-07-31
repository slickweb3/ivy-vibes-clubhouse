import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/ivy/header";
import { AmbientVibes } from "@/components/ivy/ambient";
import { CookieConsentProvider } from "@/components/ivy/cookie-consent";
import { Section } from "@/components/ivy/primitives";
import { SiteFooter } from "@/components/ivy/sections-b";
import { MemeMachine, memeTemplates } from "@/components/ivy/meme-machine";
import { getCuratedFeed } from "@/lib/curated.functions";
import { EMPTY_CURATED_FEED } from "@/types/curated";

const TITLE = "Ivy Meme Machine — make $ivy memes from Ivy's famous photos";
const DESCRIPTION =
  "Drop frog hats, crowns, shades and $ivy chains onto Ivy's most famous official photos, add a caption and download your meme. Made in your browser.";

export const Route = createFileRoute("/memes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/memes" }],
  }),
  loader: async () => ({
    curated: await getCuratedFeed().catch(() => EMPTY_CURATED_FEED),
  }),
  component: MemePage,
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">The meme machine jammed</h1>
      <p className="mt-3 text-charcoal/80">Please refresh in a moment.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Nothing hopping here</h1>
      <Link to="/" className="mt-3 inline-block underline underline-offset-4">
        Back to the clubhouse
      </Link>
    </main>
  ),
});

function MemePage() {
  const { curated } = Route.useLoaderData();
  const templates = memeTemplates(curated.all);

  return (
    <CookieConsentProvider>
      <AmbientVibes />
      <SiteNav isHome={false} />
      <main>
        <Section
          id="meme-machine"
          eyebrow="Ivy's meme lab"
          title="Ivy Meme Machine"
          intro="Ivy's most famous frames, a pile of frog fits and one big download button. Pick a photo, dress her up, caption it, post it."
          tone="lavender"
        >
          <MemeMachine templates={templates} />

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [
                "Pick the frame",
                "Every template is a poster from one of Ivy's own official posts, and each one links straight back to the original.",
              ],
              [
                "Dress the queen",
                "Frog hat, crown, shades, blep, lily pad, $ivy chain — drag, resize, spin and flip until it is perfect.",
              ],
              [
                "Share the vibe",
                "Download the PNG and post it with #ivyvibing. Everything is rendered in your browser, nothing is uploaded.",
              ],
            ].map(([heading, body]) => (
              <div key={heading} className="rounded-2xl bg-card p-4 pop-static">
                <p className="font-display text-base text-charcoal">{heading}</p>
                <p className="mt-1 text-sm text-charcoal/85">{body}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-charcoal/75">
            <Link to="/game" className="underline underline-offset-4">
              Fancy a hop instead? Play Lily Pad Leap
            </Link>
          </p>
        </Section>
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}
