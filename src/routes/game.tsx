import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/ivy/header";
import { AmbientVibes } from "@/components/ivy/ambient";
import { CookieConsentProvider } from "@/components/ivy/cookie-consent";
import { Section } from "@/components/ivy/primitives";
import { LilyPadLeap } from "@/components/ivy/minigame";
import { SiteFooter } from "@/components/ivy/sections-b";
import { getLeaderboard } from "@/lib/game.functions";
import type { Leaderboard } from "@/lib/game.server";

const TITLE = "Lily Pad Leap — the $ivy minigame & monthly leaderboard";
const DESCRIPTION =
  "Hop across the pond, scoop $ivy coins and sign your score to a Solana wallet. Top wallet each month gets a 50,000 $ivy airdrop.";

function emptyBoard(): Leaderboard {
  const now = new Date();
  const season = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return {
    season,
    seasonLabel: now.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    monthly: [],
    allTime: [],
    prizeTokens: 50_000,
    nextResetIso: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/game" }],
  }),
  loader: async () => ({ board: await getLeaderboard().catch(emptyBoard) }),
  component: GamePage,
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">The pond is a bit choppy</h1>
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

function GamePage() {
  const { board } = Route.useLoaderData();

  return (
    <CookieConsentProvider>
      <AmbientVibes />
      <SiteNav isHome={false} />
      <main>
        <Section
          id="lily-pad-leap"
          eyebrow="Ivy's arcade"
          title="Lily Pad Leap"
          intro="One button, one very good dog, one very determined pond. Sign your best run to your Solana wallet and you are on the monthly board — first place gets a 50,000 $ivy airdrop."
          tone="leaf"
          headingLevel={1}
        >
          <LilyPadLeap initialLeaderboard={board} />

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["How to play", "Tap, click or press space to hop. Tap again mid-air for a second hop. Logs and stumps end the run, coins are worth 15."],
              ["No wallet needed", "The whole game is free to play with no wallet, no sign-up and no transactions. A wallet is optional and only unlocks the season board, XP, streaks and reward eligibility."],
              ["How scores count", "Every run gets a one-time code from the server. Your wallet signs the code and the score together — a free read-only message — so only you can post your score. The server re-checks the run length, input rate and coin count before it counts."],
              ["The airdrop", "Board resets on the 1st of each month (UTC). The highest verified score that month is airdropped 50,000 $ivy to the wallet that signed it."],
            ].map(([heading, body]) => (
              <div key={heading} className="rounded-2xl bg-card p-4 pop-static">
                <h3 className="font-display text-base text-charcoal">{heading}</h3>
                <p className="mt-1 text-sm text-charcoal/85">{body}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-charcoal/70">
            XP, levels, day streaks and fair-play scores are earned by playing and can never be
            bought. Runs that look automated still show on the board but earn no XP and pause reward
            eligibility until clean runs restore it.{" "}
            Play for fun. This is a community game, not a financial product, and the airdrop is a
            discretionary community reward paid from project allocations.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}
