import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Reveal — scroll-triggered entrance for a block of content.
 *
 * The markup is identical on the server and on the client (`data-shown="true"`),
 * so hydration can never mismatch and no-JS / reduced-motion / crawler visitors
 * always see finished content. After mount, the element is hidden imperatively
 * and one IntersectionObserver flips the attribute back when it scrolls into
 * view — attribute writes only, so React never re-renders during scroll and the
 * animation (opacity + transform) stays on the compositor. The observer
 * disconnects after the first reveal.
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

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already in view on first paint (above the fold): leave it shown so the
    // hero never flashes.
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.9) return;

    node.setAttribute("data-shown", "false");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.setAttribute("data-shown", "true");
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
      data-shown="true"
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={["reveal", variant === "zoom" ? "reveal-zoom" : "reveal-up", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
