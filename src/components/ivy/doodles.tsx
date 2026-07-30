/**
 * Original CSS/SVG doodles for ivy vibing.
 * Hand-drawn crowns, paws, frogs, leaves, vines and tape — never fake Ivy imagery.
 */
import { cn } from "@/lib/utils";

type IconProps = { className?: string; title?: string };

function svgProps(title?: string) {
  return title
    ? ({ role: "img", "aria-label": title } as const)
    : ({ "aria-hidden": true, focusable: false } as const);
}

export function CrownDoodle({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn("h-6 w-9", className)} {...svgProps(title)}>
      <path
        d="M4 27 L7 8 L16 17 L24 4 L32 17 L41 8 L44 27 Z"
        fill="currentColor"
        stroke="var(--charcoal)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="4" r="2.6" fill="var(--yellow)" stroke="var(--charcoal)" strokeWidth="2" />
    </svg>
  );
}

export function PawDoodle({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-5 w-5", className)} {...svgProps(title)}>
      <ellipse cx="20" cy="27" rx="11" ry="9" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
      <circle cx="8" cy="15" r="4.6" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
      <circle cx="16" cy="8" r="4.6" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
      <circle cx="25" cy="8" r="4.6" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
      <circle cx="33" cy="15" r="4.6" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
    </svg>
  );
}

export function FrogDoodle({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 44 36" className={cn("h-5 w-6", className)} {...svgProps(title)}>
      <circle cx="13" cy="9" r="7" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
      <circle cx="31" cy="9" r="7" fill="currentColor" stroke="var(--charcoal)" strokeWidth="2.5" />
      <circle cx="13" cy="9" r="2.2" fill="var(--charcoal)" />
      <circle cx="31" cy="9" r="2.2" fill="var(--charcoal)" />
      <path
        d="M4 20 Q22 6 40 20 Q40 33 22 33 Q4 33 4 20 Z"
        fill="currentColor"
        stroke="var(--charcoal)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M15 26 Q22 30 29 26" fill="none" stroke="var(--charcoal)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function LeafDoodle({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-5 w-5", className)} {...svgProps(title)}>
      <path
        d="M28 4 C12 4 4 12 4 24 C4 27 5 28 8 28 C20 28 28 20 28 4 Z"
        fill="currentColor"
        stroke="var(--charcoal)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M24 8 L9 24" fill="none" stroke="var(--charcoal)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function VineDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className={cn("h-8 w-full text-ivy", className)}
      aria-hidden
      focusable="false"
    >
      <path
        d="M0 24 Q75 4 150 24 T300 24 T450 24 T600 24 T750 24 T900 24 T1050 24 T1200 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {[110, 260, 410, 560, 710, 860, 1010, 1160].map((x, i) => (
        <ellipse
          key={x}
          cx={x}
          cy={i % 2 ? 32 : 14}
          rx="12"
          ry="7"
          fill="var(--frog)"
          stroke="var(--charcoal)"
          strokeWidth="2.5"
          transform={`rotate(${i % 2 ? 18 : -18} ${x} ${i % 2 ? 32 : 14})`}
        />
      ))}
    </svg>
  );
}

export function GrassStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-6 w-full", className)}
      aria-hidden
      style={{
        backgroundImage:
          "repeating-linear-gradient(80deg, var(--frog) 0 6px, var(--ivy) 6px 9px, transparent 9px 18px)",
        borderTop: "3px solid var(--charcoal)",
      }}
    />
  );
}

/** A strip of masking tape for scrapbook layouts. */
export function Tape({ className, rotate = -6 }: { className?: string; rotate?: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-10 block h-6 w-24 opacity-90",
        className,
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
        background: "var(--yellow)",
        border: "2px solid rgba(21,21,21,0.35)",
        borderStyle: "dashed solid",
      }}
    />
  );
}

export function IvyWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-frog pop-static">
        <CrownDoodle className="absolute -top-3 left-1/2 h-4 w-6 -translate-x-1/2 text-yellow" />
        <PawDoodle className="h-4 w-4 text-cream" />
      </span>
      <span className="font-display text-xl leading-none tracking-tight">
        <span className="text-ivy">ivy </span>
        <span className="text-charcoal">vibing</span>
        <span className="ml-1 rounded-full bg-yellow px-1.5 py-0.5 align-middle text-[0.6rem] tracking-widest text-charcoal uppercase pop-static">
          $IVY
        </span>
      </span>
      <LeafDoodle className="h-4 w-4 text-frog" />
    </span>
  );
}
