/**
 * ScrollSignature
 *
 * The minimum JavaScript needed for the pond scrollbar's live states: it flags
 * <html> while the page is actually scrolling and while the thumb is being
 * dragged, and renders the CSS-driven scroll-depth ribbon. All visuals live in
 * styles.css — this only flips attributes, so there are no React re-renders and
 * no polling loops.
 */
import { useEffect } from "react";

const IDLE_MS = 900;

export function ScrollSignature() {
  useEffect(() => {
    const root = document.documentElement;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let queued = false;

    const settle = () => {
      root.removeAttribute("data-scrolling");
    };

    const onScroll = () => {
      if (!queued) {
        queued = true;
        // One attribute write per frame, never one per scroll event.
        requestAnimationFrame(() => {
          queued = false;
          root.setAttribute("data-scrolling", "true");
        });
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(settle, IDLE_MS);
    };

    // A pointerdown landing to the right of the content box is a thumb grab.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.clientX > root.clientWidth) {
        root.setAttribute("data-sb-grab", "true");
      }
    };

    const onPointerUp = () => {
      root.removeAttribute("data-sb-grab");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      root.removeAttribute("data-scrolling");
      root.removeAttribute("data-sb-grab");
    };
  }, []);

  return <div className="scroll-depth" aria-hidden="true" />;
}
