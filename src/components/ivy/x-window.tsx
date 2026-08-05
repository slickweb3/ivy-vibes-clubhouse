import { useEffect, useRef, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Sticker } from "./primitives";
import { FrogDoodle, PawDoodle } from "./doodles";
import { projectConfig, isSet } from "@/config/project";

/**
 * Ivy's official X window.
 *
 * This renders X's OWN embedded timeline widget for @Ivyvibing — nothing is
 * scraped, copied or re-hosted, and no API credentials are involved. The
 * widget script is only fetched once the window scrolls into view, so it never
 * costs anything on first paint.
 */

const X_HANDLE = "Ivyvibing";
const X_PROFILE_URL = isSet(projectConfig.socials.x)
  ? projectConfig.socials.x
  : `https://x.com/${X_HANDLE}`;
const X_COMMUNITY_URL = projectConfig.socials.community;
const WIDGET_SRC = "https://platform.twitter.com/widgets.js";

interface Twttr {
  widgets: {
    createTimeline: (
      source: { sourceType: "profile"; screenName: string },
      target: HTMLElement,
      options?: Record<string, unknown>,
    ) => Promise<HTMLElement | undefined>;
  };
}

let widgetPromise: Promise<Twttr | null> | null = null;

/** Loads X's widgets.js exactly once per page. */
function loadWidgets(): Promise<Twttr | null> {
  if (widgetPromise) return widgetPromise;
  widgetPromise = new Promise<Twttr | null>((resolve) => {
    const existing = (window as unknown as { twttr?: Twttr }).twttr;
    if (existing?.widgets?.createTimeline) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve((window as unknown as { twttr?: Twttr }).twttr ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return widgetPromise;
}

export function XWindow() {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  // Only fetch the third-party widget when the window is actually near the
  // viewport — same discipline as the Instagram / TikTok embeds.
  useEffect(() => {
    const node = hostRef.current;
    if (!node || state !== "idle") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("loading");
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [state]);

  useEffect(() => {
    if (state !== "loading") return;
    let cancelled = false;
    void (async () => {
      const twttr = await loadWidgets();
      const target = frameRef.current;
      if (cancelled || !target) return;
      if (!twttr?.widgets?.createTimeline) {
        setState("failed");
        return;
      }
      try {
        const rendered = await twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: X_HANDLE },
          target,
          { theme: "light", chrome: "noheader nofooter transparent", height: 640, dnt: true },
        );
        if (cancelled) return;
        setState(rendered ? "ready" : "failed");
      } catch {
        if (!cancelled) setState("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  return (
    <div
      ref={hostRef}
      className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] bg-card ink-border pop-static"
    >
      {/* Browser-ish chrome, matching the other live windows */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b-2 border-charcoal/15 bg-yellow px-4 py-3">
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
        </span>
        <span className="flex min-w-0 items-center gap-2 rounded-full bg-charcoal/10 px-3 py-1">
          <FrogDoodle aria-hidden className="h-3.5 w-4 shrink-0 text-ivy" />
          <span className="truncate text-xs text-charcoal/80">x.com/{X_HANDLE}</span>
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span
            aria-hidden
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-charcoal ink-border sm:h-24 sm:w-24"
          >
            <span className="font-display text-4xl text-cream">X</span>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-frog ink-border">
              <PawDoodle className="h-3.5 w-3.5 text-charcoal" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl leading-tight text-charcoal">Ivy</p>
            <a
              href={X_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 max-w-full items-center truncate text-sm text-ivy underline underline-offset-4"
            >
              @{X_HANDLE}
            </a>
            <p className="mt-2 text-sm text-charcoal/80">
              Ivy&apos;s official posts on X, shown by X itself.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={X_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pop inline-flex min-h-10 items-center gap-1.5 rounded-full bg-frog px-4 font-display text-charcoal"
          >
            Follow on X
            <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
          </a>
          {isSet(X_COMMUNITY_URL) ? (
            <a
              href={X_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pop inline-flex min-h-10 items-center gap-1.5 rounded-full bg-lavender px-4 font-display text-charcoal"
            >
              X Community
              <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <Sticker tone="leaf">
            <FrogDoodle className="h-3.5 w-4 text-ivy" />
            live timeline
          </Sticker>
        </div>
      </div>

      <div className="flex items-center gap-3 border-y-2 border-charcoal/15 bg-leaf/40 px-4 py-2 sm:px-6">
        <span className="font-display text-xs uppercase tracking-wide text-charcoal">
          Official X feed
        </span>
        <span aria-live="polite" className="ml-auto text-xs text-charcoal/70">
          {state === "ready" ? "live" : state === "failed" ? "unavailable" : "loading…"}
        </span>
      </div>

      <div className="relative">
        <div
          role="region"
          aria-label="Ivy's official X timeline"
          className="pond-scroll h-[28rem] overflow-y-auto overscroll-contain px-3 py-4 sm:h-[38rem] sm:px-5 lg:h-[44rem]"
        >
          <div ref={frameRef} className="min-h-full" />

          {state !== "ready" ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              {state === "failed" ? (
                <>
                  <p className="text-sm text-charcoal/80">
                    X&apos;s timeline widget couldn&apos;t load right now.
                  </p>
                  <a
                    href={X_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pop inline-flex min-h-11 items-center gap-1.5 rounded-full bg-frog px-4 font-display text-charcoal"
                  >
                    Open @{X_HANDLE} on X
                    <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
                  </a>
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    className="h-8 w-8 animate-spin rounded-full border-2 border-charcoal/20 border-t-ivy"
                  />
                  <p className="text-sm text-charcoal/70">Hopping over to X…</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-charcoal/15 px-4 py-3 text-xs sm:px-6">
        <span className="text-charcoal/70">
          Rendered by X&apos;s own embed — nothing copied or re-hosted.
        </span>
        <a
          href={X_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="pop inline-flex min-h-11 items-center gap-1 rounded-full bg-frog px-3 font-display text-charcoal"
        >
          Open profile
          <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
