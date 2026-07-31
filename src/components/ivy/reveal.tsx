import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal. Uses a single IntersectionObserver per element,
 * unobserves after the first reveal (no re-renders afterwards) and skips
 * entirely when the visitor prefers reduced motion.
 */
export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            if (delay) window.setTimeout(() => setShown(true), delay);
            else setShown(true);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return { ref, shown };
}

export function Reveal({
  children,
  as,
  className,
  delay = 0,
  variant = "up",
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger in ms. */
  delay?: number;
  variant?: "up" | "fade" | "zoom";
}) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, shown } = useReveal<HTMLElement>(delay);
  return (
    <Tag
      ref={ref}
      data-shown={shown ? "true" : "false"}
      className={cn("reveal", `reveal-${variant}`, className)}
    >
      {children}
    </Tag>
  );
}
