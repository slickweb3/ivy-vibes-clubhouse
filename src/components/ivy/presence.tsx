import { useEffect, useState } from "react";
import { discover } from "@/lib/discoveries";
import { onScrollFrame } from "@/lib/scroll-observer";


/**
 * IvyPresence — the site's ambient "living environment" layer.
 *
 * Three jobs, all transform/opacity/custom-property work so nothing costs layout:
 *  1. Pointer + scroll telemetry published as CSS custom properties
 *     (`--ivy-px`, `--ivy-py`, `--ivy-depth`) that the atmosphere layers read.
 *  2. Section-aware aura: the section in view sets the two light colours of the
 *     atmosphere, so the environment shifts as the visitor travels the page.
 *  3. Magnetic pull on chunky `.pop` controls: the hovered control leans
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

    const stopScroll = onScrollFrame((y) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const depth = max > 0 ? y / max : 0;
      root.style.setProperty("--ivy-depth", depth.toFixed(4));
    });

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

    if (fine && !reduce) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      stopScroll();
      window.removeEventListener("pointermove", onPointer);

      magnet?.style.removeProperty("--mx");
      magnet?.style.removeProperty("--my");
    };
  }, []);

  // Reactive surfaces: cards marked `data-tilt` lean toward the cursor.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine) return undefined;

    let tilted: HTMLElement | null = null;

    const clear = () => {
      tilted?.style.removeProperty("--tx");
      tilted?.style.removeProperty("--ty");
      tilted = null;
    };

    const onMove = (event: PointerEvent) => {
      const next = (event.target as HTMLElement | null)?.closest?.(
        "[data-tilt]",
      ) as HTMLElement | null;
      if (next !== tilted) clear();
      if (!next) return;
      tilted = next;
      const box = next.getBoundingClientRect();
      const nx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const ny = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
      next.style.setProperty("--tx", `${(ny * -3.2).toFixed(2)}deg`);
      next.style.setProperty("--ty", `${(nx * 3.2).toFixed(2)}deg`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      clear();
    };
  }, []);

  // Easter egg: type "ribbit" anywhere and the pond answers with a frog shower.
  const [ribbit, setRibbit] = useState(false);
  useEffect(() => {
    let typed = "";
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      if (el && /^(input|textarea)$/i.test(el.tagName)) return;
      if (event.key.length !== 1) return;
      typed = (typed + event.key.toLowerCase()).slice(-6);
      if (typed === "ribbit") {
        typed = "";
        setRibbit(true);
        discover("ribbit");
        window.setTimeout(() => setRibbit(false), 4200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Atmosphere: a soft pond light that tracks the cursor and deepens with scroll. */}
      <div aria-hidden className="ivy-atmosphere" />
      {ribbit ? (
        <div aria-hidden className="ivy-ribbit">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={index}
              className="ivy-ribbit-frog"
              style={{
                left: `${(index * 7.3 + 4) % 96}%`,
                animationDelay: `${(index % 7) * 0.18}s`,
                fontSize: `${18 + ((index * 5) % 22)}px`,
              }}
            >
              🐸
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
