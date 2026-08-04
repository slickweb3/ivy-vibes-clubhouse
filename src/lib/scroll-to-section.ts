const NAV_OFFSET = 84;

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
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

  const reduced = prefersReduced();
  const target = () =>
    Math.max(0, node.getBoundingClientRect().top + window.scrollY - NAV_OFFSET);

  window.scrollTo({ top: target(), behavior: reduced ? "auto" : "smooth" });

  // Re-align for ~900ms so late layout shifts cannot leave us off-target.
  const deadline = Date.now() + 900;
  const settle = () => {
    const top = target();
    if (Math.abs(window.scrollY - top) > 2) {
      window.scrollTo({ top, behavior: "auto" });
    }
    if (Date.now() < deadline) window.requestAnimationFrame(settle);
  };
  window.setTimeout(() => window.requestAnimationFrame(settle), reduced ? 0 : 420);

  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(null, "", `#${id}`);
  }
  return true;
}
