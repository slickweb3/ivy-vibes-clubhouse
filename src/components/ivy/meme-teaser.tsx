import { Link } from "@tanstack/react-router";
import { Section } from "@/components/ivy/primitives";
import { FrogDoodle, CrownDoodle, PawDoodle } from "@/components/ivy/doodles";

/** Compact homepage teaser that sends people to the full meme generator. */
export function MemeTeaser() {
  return (
    <Section
      id="meme-machine"
      eyebrow="Ivy's meme lab"
      title="Ivy Meme Machine"
      intro="Ivy's most famous frames plus a drawer full of frog fits. Dress her up, caption it, download it, post it."
      tone="leaf"
    >
      <div className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5 pop-static sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2">
          <CrownDoodle className="h-7 w-11 text-yellow wiggle" />
          <FrogDoodle className="h-10 w-12 text-frog float-slow" />
          <PawDoodle className="h-6 w-6 text-pink" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg text-charcoal">Frog hats. Crowns. $ivy chains.</p>
          <p className="mt-1 text-sm text-charcoal/85">
            Drag stickers onto Ivy's official photos, add a caption and save the PNG. It all
            happens in your browser.
          </p>
        </div>
        <Link
          to="/memes"
          className="ml-auto inline-flex min-h-11 shrink-0 items-center rounded-full bg-pink px-5 font-display text-charcoal pop-static transition-transform hover:-translate-y-0.5"
        >
          Make a meme
        </Link>
      </div>
    </Section>
  );
}
