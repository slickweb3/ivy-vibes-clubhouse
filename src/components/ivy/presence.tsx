import { useEffect, useState } from "react";

/**
 * IvyPresence — the site's ambient "living environment" layer.
 *
 * Three jobs, all transform/opacity only so nothing costs layout:
 *  1. A one-per-session cinematic curtain lift on first paint.
 *  2. Pointer + scroll telemetry published as CSS custom properties
 *     (`--ivy-px`, `--ivy-py`, `--ivy-depth`) that the atmosphere layers read.
 *  3. Magnetic pull on chunky `.pop` controls: the hovered control leans
 *     toward the cursor via `--mx` / `--my`.
 *
 * Everything is skipped for coarse pointers and `prefers-reduced-motion`.
 */
export function IvyPresence() {
  const [curtain, setCurtain] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("ivy-curtain") === "1";
    if (!reduce && !seen) {
      setCurtain(true);
      sessionStorage.setItem("ivy-curtain", "1");
      const t = window.setTimeout(() => setCurtain(false), 1150);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let frame = 0;
    let px = 0.5;
    let py = 0.3;
    let magnet: HTMLElement | null = null;
    let mx = 0;
    let my = 0;

    const flush = () => {
      frame = 0;
      root.style.setProperty("--ivy-px", px.toFixed(4));
      root.style.setProperty("--ivy-py", py.toFixed(4));
      if (magnet) {
        magnet.style.setProperty("--mx", `${mx.toFixed(2)}px`);
        magnet.style.setProperty("--my", `${my.toFixed(2)}px`);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const depth = max > 0 ? window.scrollY / max : 0;
      root.style.setProperty("--ivy-depth", depth.toFixed(4));
    };

    const onPointer = (event: PointerEvent) => {
      px = event.clientX / window.innerWidth;
      py = event.clientY / window.innerHeight;

      const next = (event.target as HTMLElement | null)?.closest?.(".pop") as HTMLElement | null;
      if (next !== magnet) {
        magnet?.style.removeProperty("--mx");
        magnet?.style.removeProperty("--my");
        magnet = next;
      }
      if (magnet) {
        const box = magnet.getBoundingClientRect();
        // Clamp the lean so a wide button never slides away from its shadow.
        mx = Math.max(-6, Math.min(6, (event.clientX - (box.left + box.width / 2)) * 0.14));
        my = Math.max(-4, Math.min(4, (event.clientY - (box.top + box.height / 2)) * 0.12));
      }
      schedule();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine && !reduce) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      magnet?.style.removeProperty("--mx");
      magnet?.style.removeProperty("--my");
    };
  }, []);

  return (
    <>
      {/* Atmosphere: a soft pond light that tracks the cursor and deepens with scroll. */}
      <div aria-hidden className="ivy-atmosphere" />
      {curtain ? (
        <div aria-hidden className="ivy-curtain">
          <span className="ivy-curtain-mark">ivy vibing</span>
        </div>
      ) : null}
    </>
  );
}
