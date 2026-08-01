import { useEffect, useState } from "react";

/**
 * PressRipple — a small pond ripple wherever the visitor presses.
 *
 * Two thin brand-tinted rings plus a soft radial lens that lightly distorts
 * (blur + saturate) what sits underneath. Deliberately small and short so it
 * reads as playful feedback rather than an effect show. Skipped entirely for
 * reduced-motion visitors.
 */

type Drop = { id: number; x: number; y: number };

export function PressRipple() {
  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let id = 0;
    const onDown = (event: PointerEvent) => {
      const drop = { id: id++, x: event.clientX, y: event.clientY };
      setDrops((was) => [...was.slice(-4), drop]);
      window.setTimeout(() => {
        setDrops((was) => was.filter((d) => d.id !== drop.id));
      }, 700);
    };

    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  if (!drops.length) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="ivy-ripple"
          style={{ left: `${drop.x}px`, top: `${drop.y}px` }}
        >
          <span className="ivy-ripple-lens" />
          <span className="ivy-ripple-ring" />
          <span className="ivy-ripple-ring ivy-ripple-ring-2" />
        </span>
      ))}
    </div>
  );
}
