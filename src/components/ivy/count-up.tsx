import { useEffect, useRef, useState } from "react";

/**
 * Animated number that counts up the first time it scrolls into view.
 *
 * - GPU-free: only text content changes, no layout thrash (the container keeps
 *   tabular figures so the width never jumps).
 * - Respects `prefers-reduced-motion` by rendering the final value instantly.
 * - Announced once to screen readers via the final formatted string.
 */
export function CountUp({
  value,
  format,
  duration = 900,
  className,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;
    const reduced =
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || reduced) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let cancelled = false;
    const run = () => {
      const start = performance.now();
      const from = 0;
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(from + (value - from) * eased);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            run();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span aria-hidden>{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
