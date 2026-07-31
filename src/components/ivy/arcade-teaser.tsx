import { Link } from "@tanstack/react-router";
import { Section } from "@/components/ivy/primitives";
import { FrogDoodle, CrownDoodle } from "@/components/ivy/doodles";

/** Compact homepage teaser that sends players to the full game route. */
export function ArcadeTeaser() {
  return (
    <Section
      id="arcade"
      eyebrow="Ivy's arcade"
      title="Lily Pad Leap"
      intro="One button, one very good dog, one very determined pond. Post a verified score with your Solana wallet — the top wallet each month is airdropped 50,000 $ivy."
      tone="lavender"
    >
      <div className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5 pop-static sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2">
          <FrogDoodle className="h-10 w-12 text-frog float-slow" />
          <CrownDoodle className="h-7 w-11 text-yellow wiggle" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg text-charcoal">Hop the pond, take the crown</p>
          <p className="mt-1 text-sm text-charcoal/85">
            Dodge the reeds, scoop the coins, sign your best run to your wallet. Monthly board
            resets on the 1st.
          </p>
        </div>
        <Link
          to="/game"
          className="ml-auto inline-flex min-h-11 shrink-0 items-center rounded-full bg-frog px-5 font-display text-charcoal pop"
        >
          Play Lily Pad Leap
        </Link>
      </div>
    </Section>
  );
}
