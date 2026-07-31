import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ivySticker from "@/assets/ivy-hop-sticker.png.asset.json";

/**
 * Tucked-away Ivy sticker that hops up the screen when you tap her.
 *
 * Deliberately stealthy — she sits low in the corner behind the content —
 * but a soft pulsing ring, a gentle idle bob and a hover lift make her read
 * as very clickable. Under `prefers-reduced-motion` she simply sits still and
 * the click swaps the caption without any movement.
 */

const CHEERS = [
  "ribbit!",
  "boing!",
  "wheee!",
  "short spine, big air",
  "hop hop hop",
  "she flies",
  "10/10 landing",
];

export function IvyHopSticker() {
  const [leaping, setLeaping] = useState(false);
  const [puffKey, setPuffKey] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  const [hops, setHops] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const hop = () => {
    if (leaping) return;
    setLeaping(true);
    setPuffKey((key) => key + 1);
    setHops((count) => count + 1);
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    timers.current.push(
      window.setTimeout(() => setLeaping(false), 1300),
      window.setTimeout(() => setCheer(null), 2800),
    );
  };

  // Only show the bubble once she has landed, so the caption never trails
  // alongside the airborne sticker as a second floating label.
  const showCheer = Boolean(cheer) && !leaping;

  return (
    <div className="pointer-events-none fixed bottom-0 left-2 z-40 select-none sm:left-4">
      <div className="relative flex flex-col items-center">
        {/* Cheer bubble — absolutely placed so it never nudges the sticker */}
        <span
          aria-hidden
          className={cn(
            "absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-full bg-cream px-3 py-1 font-display text-xs whitespace-nowrap text-ivy ink-border transition-all duration-200",
            showCheer ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
          )}
        >
          {cheer ?? "ribbit!"}
        </span>


        <button
          type="button"
          onClick={hop}
          aria-label={`Make Ivy hop${hops ? ` (${hops} hops so far)` : ""}`}
          className="group pointer-events-auto relative block cursor-pointer rounded-full focus-visible:ring-4 focus-visible:ring-frog focus-visible:outline-none"
        >
          {/* Pulsing "tap me" ring */}
          <span
            aria-hidden
            className="absolute inset-x-1 bottom-1 top-2 rounded-full border-4 border-frog/70 motion-safe:ivy-sticker-ring"
          />
          {/* Landing puff */}
          <span
            key={puffKey}
            aria-hidden
            className={cn(
              "absolute -bottom-1 left-1/2 h-6 w-16 -translate-x-1/2 rounded-full bg-leaf/70 blur-[2px]",
              puffKey > 0 && "motion-safe:ivy-sticker-puff",
            )}
          />
          <img
            src={ivySticker.url}
            alt=""
            aria-hidden
            width={671}
            height={779}
            decoding="async"
            loading="lazy"
            className={cn(
              "relative h-24 w-auto drop-shadow-[0_6px_0_rgba(21,21,21,0.35)] transition-transform duration-200 sm:h-28",
              "group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95",
              leaping ? "motion-safe:ivy-sticker-leap" : "motion-safe:ivy-sticker-idle",
            )}
          />
        </button>
      </div>
    </div>
  );
}
