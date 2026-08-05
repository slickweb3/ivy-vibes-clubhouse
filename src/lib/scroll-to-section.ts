const NAV_OFFSET = 84;

function prefersReduced() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scrolls to an in-page section and keeps correcting the target while the page
 * settles. Lazy images, embeds and fonts change the document height after the
 * first jump, so a single `scrollIntoView` can land in the wrong place.
 */
export function scrollToSection(hash: string) {
  if (typeof window === "undefined") return false;
  const id = hash.replace(/^#/, "");
  const node = document.getElementById(id);
  if (!node) return false;

  const target = () => Math.max(0, node.getBoundingClientRect().top + window.scrollY - NAV_OFFSET);

  const distance = Math.abs(target() - window.scrollY);
  // Short hops animate; long hops jump instantly, which is both snappier and
  // immune to layout shifts happening mid-animation.
  const smooth = !prefersReduced() && distance < window.innerHeight * 1.5;
  window.scrollTo({ top: target(), behavior: smooth ? "smooth" : "auto" });

  // Keep re-aligning while images, embeds and fonts settle the layout.
  const deadline = Date.now() + 1600;
  const settle = () => {
    const top = target();
    if (Math.abs(window.scrollY - top) > 2) {
      window.scrollTo({ top, behavior: "auto" });
    }
    if (Date.now() < deadline) window.requestAnimationFrame(settle);
  };
  window.setTimeout(() => window.requestAnimationFrame(settle), smooth ? 500 : 0);

  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(null, "", `#${id}`);
  }
  return true;
}
