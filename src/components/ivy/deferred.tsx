/**
 * Deferred mount — keeps heavy, interactive, below-the-fold features out of
 * the first paint and out of the initial JavaScript bundle.
 *
 * The placeholder reserves layout space (so nothing jumps), and the real
 * component's chunk is only fetched once the reader is close to it. Anything
 * with SEO value stays server-rendered; this is for interactive toys only.
 */
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

export function DeferredMount({
  children,
  fallback,
  rootMargin = "600px",
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  if (!visible) {
    return (
      <div ref={anchorRef} aria-hidden="true">
        {fallback ?? <SectionSkeleton />}
      </div>
    );
  }

  return <Suspense fallback={fallback ?? <SectionSkeleton />}>{children}</Suspense>;
}

/** Neutral, brand-tinted placeholder that matches a section's rough height. */
export function SectionSkeleton({ height = 420 }: { height?: number }) {
  return (
    <div className="px-4 py-10" style={{ minHeight: height }}>
      <div className="mx-auto h-full max-w-4xl animate-pulse rounded-3xl bg-cream/5" />
    </div>
  );
}
