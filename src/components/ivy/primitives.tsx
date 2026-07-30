import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { CrownDoodle, PawDoodle, Tape } from "./doodles";
import { displayCaption, posterUrl, type UnifiedMediaItem } from "@/types/media";


export type Tone = "leaf" | "cream" | "lavender" | "yellow" | "pink" | "frog";

const toneBg: Record<Tone, string> = {
  leaf: "bg-leaf",
  cream: "bg-cream",
  lavender: "bg-lavender",
  yellow: "bg-yellow",
  pink: "bg-pink",
  frog: "bg-frog",
};

const aspectMap = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
  tall: "aspect-[9/16]",
} as const;

/**
 * Labelled owner-approved-media placeholder.
 * Never a stock dog photo and never an artificial Ivy.
 */
export function MediaPlaceholder({
  label,
  hint,
  aspect = "square",
  tone = "leaf",
  className,
  compact = false,
}: {
  label: string;
  hint?: string;
  aspect?: keyof typeof aspectMap;
  tone?: Tone;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Owner-approved media placeholder — ${label}`}
      className={cn(
        "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-3 text-center ink-border",
        aspectMap[aspect],
        toneBg[tone],
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(21,21,21,0.07) 0 10px, transparent 10px 20px)",
      }}
    >
      <PawDoodle className="h-6 w-6 text-cream/80" />
      {!compact && (
        <span className="rounded-full bg-charcoal px-2.5 py-1 font-display text-[0.6rem] tracking-[0.15em] text-cream uppercase">
          Owner media slot
        </span>
      )}
      <span className="max-w-[22ch] font-display text-xs leading-tight text-charcoal sm:text-sm">
        {label}
      </span>
      {hint ? <span className="text-[0.7rem] text-charcoal/70">{hint}</span> : null}
    </div>
  );
}

/**
 * Renders an approved item from the unified media model inside the same
 * frame as the placeholder, so the layout never shifts. When no approved item
 * exists yet it falls back to the labelled owner-media placeholder.
 *
 * This shows the platform's own poster/thumbnail — it is not a third-party
 * embed, so it is not cookie-consent gated. Actual embeds are.
 */
export function ApprovedMedia({
  item,
  label,
  hint,
  aspect = "square",
  tone = "leaf",
  className,
  compact = false,
}: {
  item?: UnifiedMediaItem | null;
  label: string;
  hint?: string;
  aspect?: keyof typeof aspectMap;
  tone?: Tone;
  className?: string;
  compact?: boolean;
}) {
  const poster = item ? posterUrl(item) : null;
  if (!item || !poster) {
    return (
      <MediaPlaceholder
        label={label}
        hint={hint}
        aspect={aspect}
        tone={tone}
        className={className}
        compact={compact}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl ink-border",
        aspectMap[aspect],
        toneBg[tone],
        className,
      )}
    >
      <img
        src={poster}
        alt={item.altText || displayCaption(item) || "Official Ivy media"}
        loading="lazy"
        decoding="async"
        width={item.width ?? undefined}
        height={item.height ?? undefined}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export function ComingSoonPill({ className }: { className?: string }) {

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-yellow px-2.5 py-1 font-display text-xs tracking-wide text-charcoal uppercase pop-static",
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
  float = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  float?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs tracking-wide text-charcoal uppercase pop-static",
        toneBg[tone],
        float && "float-slow",
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
  headingClassName,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  tone?: "cream" | "leaf" | "ivy" | "white" | "lavender";
  headingClassName?: string;
}) {
  const toneClass = {
    cream: "bg-cream text-charcoal",
    leaf: "bg-leaf text-charcoal",
    ivy: "night text-cream",
    white: "bg-card text-card-foreground",
    lavender: "bg-lavender text-charcoal",
  }[tone];

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-32 py-16 sm:py-24", toneClass, className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="mb-10 max-w-3xl">
          {eyebrow ? (
            <Sticker tone="yellow">
              <CrownDoodle className="h-3.5 w-5 text-frog" />
              {eyebrow}
            </Sticker>
          ) : null}
          <h2
            id={`${id}-title`}
            className={cn("mt-4 text-3xl leading-[1.05] sm:text-5xl", headingClassName)}
          >
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
  aspect = "square",
  tape = true,
  className,
}: {
  label: string;
  caption: string;
  rotate?: number;
  tone?: Tone;
  aspect?: keyof typeof aspectMap;
  tape?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn("polaroid relative w-full transition-transform hover:-rotate-1", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape ? <Tape className="-top-3 left-1/2 -translate-x-1/2" rotate={rotate > 0 ? -8 : 7} /> : null}
      <MediaPlaceholder label={label} aspect={aspect} tone={tone} compact />
      <figcaption className="mt-3 text-center font-display text-sm text-charcoal">{caption}</figcaption>
    </figure>
  );
}

export function InfoCard({
  title,
  body,
  tone = "cream",
  icon,
  className,
}: {
  title: string;
  body: string;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-5 pop-static", toneBg[tone], className)}>
      {icon ? <div className="mb-3">{icon}</div> : null}
      <h3 className="font-display text-lg text-charcoal">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{body}</p>
    </div>
  );
}

/** Honest status chip. Never colour-only: always carries text. */
export function StatusChip({
  status,
  label,
  className,
}: {
  status: "ok" | "pending" | "off";
  label: string;
  className?: string;
}) {
  const map = {
    ok: "bg-frog text-charcoal",
    pending: "bg-yellow text-charcoal",
    off: "bg-muted text-charcoal",
  }[status];
  const symbol = { ok: "●", pending: "◐", off: "○" }[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[0.7rem] tracking-wide uppercase pop-static",
        map,
        className,
      )}
    >
      <span aria-hidden>{symbol}</span>
      {label}
    </span>
  );
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-11 items-center gap-1 font-display text-sm underline underline-offset-4",
        className,
      )}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
      <span aria-hidden>↗</span>
    </a>
  );
}
