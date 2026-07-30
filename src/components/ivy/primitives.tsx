import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Labelled, owner-approved-media placeholder. Never a stock dog photo. */
export function MediaPlaceholder({
  label,
  hint,
  aspect = "square",
  tone = "leaf",
  className,
}: {
  label: string;
  hint?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
  tone?: "leaf" | "cream" | "lavender" | "yellow" | "pink";
  className?: string;
}) {
  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  }[aspect];

  const toneClass = {
    leaf: "bg-leaf",
    cream: "bg-cream",
    lavender: "bg-lavender",
    yellow: "bg-yellow",
    pink: "bg-pink",
  }[tone];

  return (
    <div
      role="img"
      aria-label={`Media placeholder: ${label}`}
      className={cn(
        "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-4 text-center ink-border",
        aspectClass,
        toneClass,
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(21,21,21,0.06) 0 10px, transparent 10px 20px)",
      }}
    >
      <span className="rounded-full bg-charcoal px-3 py-1 font-display text-[0.65rem] tracking-widest text-cream uppercase">
        Owner media slot
      </span>
      <span className="font-display text-sm leading-tight text-charcoal sm:text-base">{label}</span>
      {hint ? <span className="text-xs text-charcoal/70">{hint}</span> : null}
    </div>
  );
}

export function ComingSoon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-yellow px-2.5 py-1 font-display text-xs tracking-wide text-charcoal uppercase ink-border",
        className,
      )}
    >
      Coming Soon
    </span>
  );
}

export function Sticker({
  children,
  tone = "pink",
  className,
}: {
  children: ReactNode;
  tone?: "pink" | "lavender" | "yellow" | "frog" | "leaf";
  className?: string;
}) {
  const toneClass = {
    pink: "bg-pink",
    lavender: "bg-lavender",
    yellow: "bg-yellow",
    frog: "bg-frog",
    leaf: "bg-leaf",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs tracking-wide text-charcoal uppercase pop-static",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className,
  tone = "cream",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  tone?: "cream" | "leaf" | "ivy" | "white";
}) {
  const toneClass = {
    cream: "bg-cream text-charcoal",
    leaf: "bg-leaf text-charcoal",
    ivy: "night text-cream",
    white: "bg-card text-card-foreground",
  }[tone];

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-28 py-16 sm:py-24", toneClass, className)}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="mb-10 max-w-3xl">
          {eyebrow ? <Sticker tone="yellow">{eyebrow}</Sticker> : null}
          <h2 id={`${id}-title`} className="mt-4 text-3xl leading-[1.05] sm:text-5xl">
            {title}
          </h2>
          {intro ? <p className="mt-4 text-base opacity-90 sm:text-lg">{intro}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Polaroid({
  label,
  caption,
  rotate = 0,
  tone = "leaf",
}: {
  label: string;
  caption: string;
  rotate?: number;
  tone?: "leaf" | "cream" | "lavender" | "yellow" | "pink";
}) {
  return (
    <figure className="polaroid w-full" style={{ transform: `rotate(${rotate}deg)` }}>
      <MediaPlaceholder label={label} aspect="square" tone={tone} />
      <figcaption className="mt-3 text-center font-display text-sm text-charcoal">{caption}</figcaption>
    </figure>
  );
}
