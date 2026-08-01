import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ivySticker from "@/assets/ivy-hop-sticker.png.asset.json";
import { discover } from "@/lib/discoveries";

/**
 * Tucked-away Ivy sticker that hops up the screen when you tap her.
 *
 * Deliberately stealthy — she sits low in the corner behind the content —
 * but a soft pulsing ring, a gentle idle bob and a hover lift make her read
 * as very clickable. No captions: the hop itself is the whole joke.
 */

type Move = "leap" | "flip" | "double";

const MOVE_CLASS: Record<Move, string> = {
  leap: "motion-safe:ivy-sticker-leap",
  flip: "motion-safe:ivy-sticker-flip",
  double: "motion-safe:ivy-sticker-double-flip",
};

const MOVE_DURATION: Record<Move, number> = {
  leap: 1300,
  flip: 1500,
  double: 1750,
};

export function IvyHopSticker() {
  const [move, setMove] = useState<Move | null>(null);
  const [puffKey, setPuffKey] = useState(0);
  const [hops, setHops] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const hop = () => {
    if (move) return;
    const next = hops + 1;
    // Every 8th hop is a double backflip, every other 4th is a single.
    const nextMove: Move = next % 8 === 0 ? "double" : next % 4 === 0 ? "flip" : "leap";
    setMove(nextMove);
    setPuffKey((key) => key + 1);
    setHops(next);
    if (nextMove === "double") discover("double");
    else if (nextMove === "flip") discover("flip");
    timers.current.push(window.setTimeout(() => setMove(null), MOVE_DURATION[nextMove]));
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-2 z-40 select-none sm:left-4">
      <div className="relative flex flex-col items-center">
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
              move ? MOVE_CLASS[move] : "motion-safe:ivy-sticker-idle",
            )}
          />
        </button>
      </div>
    </div>
  );
}
