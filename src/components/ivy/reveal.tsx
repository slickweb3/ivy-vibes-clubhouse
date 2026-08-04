import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Reveal — scroll-triggered entrance for a block of content.
 *
 * Elements render visible-by-default (no-JS, reduced motion and search crawlers
 * all see finished content); once mounted, the element starts hidden and one
 * IntersectionObserver flips `data-shown` when it enters the viewport. Only
 * opacity/transform animate, so the work stays on the compositor. The observer
 * disconnects after the first reveal — nothing keeps observing forever.
 */
export function Reveal({
  children,
  as,
  variant = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: "up" | "zoom";
  delay?: number;
  className?: string;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState<boolean | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    setShown(false);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-shown={shown === null ? "true" : String(shown)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={["reveal", variant === "zoom" ? "reveal-zoom" : "reveal-up", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
