import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to the pond" control. Sits bottom-right (Ivy's hop sticker
 * owns bottom-left), appears once the visitor is a screen and a half down and
 * is fully keyboard reachable. Hidden from the tab order while off-screen.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const past = window.scrollY > window.innerHeight * 1.5;
        setVisible((was) => (was === past ? was : past));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }}
      tabIndex={visible ? 0 : -1}
      aria-hidden={visible ? undefined : true}
      data-visible={visible ? "true" : "false"}
      className="back-to-top fixed right-9 bottom-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow text-charcoal pop sm:right-16 sm:bottom-6"
    >
      <ArrowUp aria-hidden className="h-5 w-5" />
      <span className="sr-only">Back to top</span>
    </button>
  );
}
