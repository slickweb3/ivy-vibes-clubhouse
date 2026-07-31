import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { CrownDoodle, PawDoodle, Tape } from "./doodles";
import { displayCaption, posterUrl, type UnifiedMediaItem } from "@/types/media";


export type Tone = "leaf" | "cream" | "lavender" | "yellow" | "pink" | "frog";

const toneBg: Record<Tone, string> = {
  leaf: "bg-leaf",
  cream: "bg-card",
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
 * Decorative clubhouse tile. Purely ornamental brand pattern — it never asks
 * for media, never shows a stock dog and never fakes an Ivy photo.
 */
export function MediaPlaceholder({
  label: _label,
  hint: _hint,
  aspect = "square",
  tone = "leaf",
  className,
  compact: _compact = false,
}: {
  label?: string;
  hint?: string;
  aspect?: keyof typeof aspectMap;
  tone?: Tone;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-xl ink-border",
        aspectMap[aspect],
        toneBg[tone],
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(21,21,21,0.06) 0 12px, transparent 12px 24px)",
      }}
    >
      <div className="flex items-center gap-2 opacity-70">
        <PawDoodle className="h-6 w-6 text-charcoal" />
        <CrownDoodle className="h-6 w-6 text-charcoal" />
      </div>
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

/** Keeps the "$ivy" ticker lowercase inside uppercase-styled chips. */
export function keepTickerCase(children: ReactNode): ReactNode {
  if (typeof children !== "string") return children;
  const parts = children.split(/(\$ivy)/gi);
  if (parts.length === 1) return children;
  return parts.map((part, index) =>
    /^\$ivy$/i.test(part) ? (
      <span key={index} className="lowercase">
        $ivy
      </span>
    ) : (
      part
    ),
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
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs tracking-wide text-charcoal pop-static",
        toneBg[tone],
        float && "float-slow",
        className,
      )}
    >
      {keepTickerCase(children)}
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
  headingLevel = 2,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  tone?: "cream" | "leaf" | "ivy" | "white" | "lavender";
  headingClassName?: string;
  /** Use 1 on pages where this section is the page's primary heading. */
  headingLevel?: 1 | 2;
}) {
  const toneClass = {
    cream: "bg-background text-foreground band-cream",
    leaf: "bg-leaf text-charcoal band-leaf",
    ivy: "night text-cream band-ivy",
    white: "bg-card text-card-foreground band-cream",
    lavender: "bg-lavender text-charcoal band-lavender",
  }[tone];

  const Heading = (headingLevel === 1 ? "h1" : "h2") as "h1" | "h2";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative scroll-mt-28 py-14 sm:py-20 lg:py-24",
        toneClass,
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal as="header" className="mb-8 max-w-3xl sm:mb-10">
          {eyebrow ? (
            <Sticker tone="yellow">
              <CrownDoodle className="h-3.5 w-5 text-frog" />
              {eyebrow}
            </Sticker>
          ) : null}
          <Heading
            id={`${id}-title`}
            className={cn("mt-4 text-fluid-title text-balance", headingClassName)}
          >
            {title}
          </Heading>
          <div aria-hidden className="brand-rule mt-5 w-24" />
          {intro ? (
            <p className="measure mt-4 text-base leading-relaxed opacity-90 sm:text-lg">{intro}</p>
          ) : null}
        </Reveal>
        <Reveal delay={90}>{children}</Reveal>
      </div>
    </section>
  );
}




export function Polaroid({
  item,
  label,
  caption,
  rotate = 0,
  tone = "leaf",
  aspect = "square",
  tape = true,
  className,
}: {
  item?: UnifiedMediaItem | null;
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
      <ApprovedMedia item={item} label={label} aspect={aspect} tone={tone} compact />
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
    off: "bg-muted text-cream",
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
