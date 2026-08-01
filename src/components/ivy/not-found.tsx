import { Link } from "@tanstack/react-router";
import { FrogDoodle, LeafDoodle, PawDoodle } from "./doodles";
import { Sticker } from "./primitives";

/**
 * On-brand "lost in the pond" screen.
 *
 * Shared by the router's `notFoundComponent` and the catch-all `/$` route so a
 * mistyped URL still looks like Ivy's clubhouse instead of a bare error page.
 */
export function IvyNotFound() {
  return (
    <main className="relative flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <Sticker tone="yellow">
        <FrogDoodle className="h-3.5 w-4 text-ivy" />
        Wrong lily pad
      </Sticker>
      <p aria-hidden className="flex items-center justify-center gap-3">
        <LeafDoodle className="h-8 w-8 text-frog" />
        <PawDoodle className="h-7 w-7 text-pink" />
        <LeafDoodle className="h-8 w-8 text-leaf" />
      </p>
      <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
        404 — Ivy hopped somewhere else
      </h1>
      <p className="max-w-prose text-foreground/80">
        This page isn&apos;t in the clubhouse. Ivy suggests the front pond, or a quick round of Lily
        Pad Leap.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="pop inline-flex min-h-11 items-center rounded-full bg-frog px-5 font-display text-charcoal"
        >
          Back to the clubhouse
        </Link>
        <Link
          to="/game"
          className="pop inline-flex min-h-11 items-center rounded-full bg-lavender px-5 font-display text-charcoal"
        >
          Play Lily Pad Leap
        </Link>
      </div>
    </main>
  );
}
