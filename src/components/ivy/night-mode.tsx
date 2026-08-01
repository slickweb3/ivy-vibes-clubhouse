import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * NightMode — flips the whole pond into a moonlit version of itself.
 *
 * The `dark` class on <html> drives every token; this component adds the
 * decorative sky (stars + moon) and remembers the visitor's choice.
 */

const KEY = "ivy-night-mode";

function apply(night: boolean) {
  document.documentElement.classList.toggle("dark", night);
  document.documentElement.style.colorScheme = night ? "dark" : "light";
}

export function NightModeToggle() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    const initial = stored
      ? stored === "on"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setNight(initial);
    apply(initial);
  }, []);

  const toggle = useCallback(() => {
    setNight((was) => {
      const next = !was;
      window.localStorage.setItem(KEY, next ? "on" : "off");
      apply(next);
      return next;
    });
  }, []);

  return (
    <>
      <div className="night-wash" aria-hidden />
      <div className="night-hue" aria-hidden />
      <div className="night-sky" aria-hidden />
      <div className="night-moon" aria-hidden />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={night}
        title={night ? "Back to daytime pond" : "Switch to night pond"}
        className="pop fixed right-4 bottom-36 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-charcoal sm:right-6 sm:bottom-40"
      >
        {night ? (
          <Sun aria-hidden className="h-5 w-5" />
        ) : (
          <Moon aria-hidden className="h-5 w-5" />
        )}
        <span className="sr-only">{night ? "Turn on day mode" : "Turn on night mode"}</span>
      </button>
    </>
  );
}
