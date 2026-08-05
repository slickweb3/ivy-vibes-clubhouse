import { useEffect, useRef, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Sticker } from "./primitives";
import { FrogDoodle, PawDoodle } from "./doodles";
import { projectConfig, isSet } from "@/config/project";

/**
 * Ivy's official X window.
 *
 * This renders X's OWN syndicated timeline for @Ivyvibing in a plain iframe —
 * nothing is scraped, copied or re-hosted, and no API credentials are
 * involved. Using the syndication URL directly avoids widgets.js, which often
 * silently fails to mount (ad blockers, script timeouts, tracking guards).
 */

const X_HANDLE = "Ivyvibing";
const X_PROFILE_URL = isSet(projectConfig.socials.x)
  ? projectConfig.socials.x
  : `https://x.com/${X_HANDLE}`;
const X_COMMUNITY_URL = projectConfig.socials.community;

function timelineSrc(origin: string) {
  const params = new URLSearchParams({
    dnt: "true",
    embedId: "twitter-widget-ivy",
    frame: "false",
    hideBorder: "true",
    hideFooter: "true",
    hideHeader: "true",
    hideScrollBar: "false",
    lang: "en",
    origin,
    theme: "light",
    transparent: "true",
    widgetsVersion: "2615f7e52b7e0:1702314776716",
  });
  return `https://syndication.twitter.com/srv/timeline-profile/screen-name/${X_HANDLE}?${params.toString()}`;
}

export function XWindow() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [src, setSrc] = useState<string | null>(null);

  // Only mount the third-party frame when the window is actually near the
  // viewport — same discipline as the Instagram / TikTok embeds.
  useEffect(() => {
    const node = hostRef.current;
    if (!node || state !== "idle") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSrc(timelineSrc(window.location.origin));
          setState("loading");
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [state]);

  // X's syndication response can hang; stop waiting after 20s and offer a
  // direct link instead of spinning forever.
  useEffect(() => {
    if (state !== "loading") return;
    const giveUp = window.setTimeout(() => {
      setState((prev) => (prev === "loading" ? "failed" : prev));
    }, 20_000);
    return () => window.clearTimeout(giveUp);
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
        <div className="h-[28rem] overflow-hidden sm:h-[38rem] lg:h-[44rem]">
          {src ? (
            <iframe
              src={src}
              title="Ivy's official X timeline"
              loading="lazy"
              scrolling="yes"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              className="h-full w-full border-0"
              onLoad={() => setState("ready")}
              onError={() => setState("failed")}
            />
          ) : null}
        </div>


        {/* Overlay, so the loading / fallback state sits inside the viewport
            rather than being pushed below the (tall) widget container. */}
        {state !== "ready" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-4 text-center">
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
