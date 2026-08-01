import { useEffect, useState } from "react";

/**
 * IvyPresence — the site's ambient "living environment" layer.
 *
 * Four jobs, all transform/opacity/custom-property work so nothing costs layout:
 *  1. A one-per-session cinematic curtain lift on first paint.
 *  2. Pointer + scroll telemetry published as CSS custom properties
 *     (`--ivy-px`, `--ivy-py`, `--ivy-depth`) that the atmosphere layers read.
 *  3. Section-aware aura: the section in view sets the two light colours of the
 *     atmosphere, so the environment shifts as the visitor travels the page.
 *  4. Magnetic pull on chunky `.pop` controls: the hovered control leans
 *     toward the cursor via `--mx` / `--my`.
 *
 * Everything heavy is skipped for coarse pointers and `prefers-reduced-motion`.
 */

/** Aura pairs cycle through the brand palette — never off-brand hues. */
const AURAS: Array<[string, string]> = [
  ["var(--frog)", "var(--lavender)"],
  ["var(--light-leaf)", "var(--frog)"],
  ["var(--yellow)", "var(--light-leaf)"],
  ["var(--pink)", "var(--lavender)"],
  ["var(--lavender)", "var(--frog)"],
  ["var(--frog)", "var(--yellow)"],
];

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

  // Section-aware aura. One observer, no scroll math, no re-renders.
  useEffect(() => {
    const root = document.documentElement;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main > section, main > div > section"),
    );
    if (sections.length === 0) return undefined;

    const apply = (index: number) => {
      const [a, b] = AURAS[index % AURAS.length]!;
      root.style.setProperty("--ivy-aura-a", a);
      root.style.setProperty("--ivy-aura-b", b);
    };
    apply(0);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        apply(sections.indexOf(visible.target as HTMLElement));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01, 0.25] },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      root.style.removeProperty("--ivy-aura-a");
      root.style.removeProperty("--ivy-aura-b");
    };
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
