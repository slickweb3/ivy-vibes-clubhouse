import { useEffect, useRef, useState } from "react";
import { ExternalLinkIcon, Play } from "lucide-react";
import { useEmbedConsent } from "./cookie-consent";
import { Sticker } from "./primitives";
import { CrownDoodle, FrogDoodle, PawDoodle } from "./doodles";
import {
  curatedFallbackLabel,
  platformLabel,
  type CuratedPost,
} from "@/types/curated";
import { cn } from "@/lib/utils";

/** Keeps at most one TikTok player mounted at a time (mobile performance). */
const activePlayerListeners = new Set<(id: string) => void>();

/**
 * Renders one curated post using the platform's OWN official embed.
 *
 * Nothing is downloaded, proxied or rehosted: the iframe points straight at
 * Instagram / TikTok, and Ivy's original caption is shown by the platform
 * inside that frame. When embeds are disabled in cookie settings, only a
 * branded card with a direct link is rendered — no third-party request is made.
 */
export function OfficialSocialEmbed({
  post,
  className,
  tone = "leaf",
  compact = false,
}: {
  post: CuratedPost;
  className?: string;
  tone?: "leaf" | "cream" | "lavender" | "yellow" | "pink";
  compact?: boolean;
}) {
  const { embedsAllowed, openSettings } = useEmbedConsent();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Only mount the third-party iframe once the card is near the viewport, so a
  // page with many embeds stays smooth instead of loading everything at once.
  const [inView, setInView] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // Mount well before the card is visible so the player is ready on arrival.
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  const label = platformLabel(post.platform);
  const fallbackLabel = curatedFallbackLabel(post);
  const [playing, setPlaying] = useState(false);
  const [posterBroken, setPosterBroken] = useState(false);
  const isTikTok = post.platform === "tiktok";

  // Phones struggle when many TikTok players exist at once, so a video player is
  // only mounted on tap and any previously opened player is unmounted first.
  useEffect(() => {
    if (!playing) return;
    const id = post.id;
    const listener = (next: string) => {
      if (next !== id) setPlaying(false);
    };
    activePlayerListeners.add(listener);
    activePlayerListeners.forEach((other) => {
      if (other !== listener) other(id);
    });
    return () => {
      activePlayerListeners.delete(listener);
    };

  }, [playing, post.id]);


  // TikTok gives us its own official poster image, so the card shows a real
  // picture straight away and the video opens in TikTok's player on tap.
  const showPlayGate = isTikTok && !playing;
  const usePoster = showPlayGate && !!post.thumbnailUrl && !posterBroken;
  const showEmbed = embedsAllowed && !failed;
  const aspect = isTikTok ? "aspect-[9/16]" : "aspect-[3/4]";
  const embedSrc =
    isTikTok && playing
      ? `${post.officialEmbedUrl}${post.officialEmbedUrl.includes("?") ? "&" : "?"}autoplay=1`
      : post.officialEmbedUrl;


  return (
    <figure
      className={cn(
        "embed-perf flex min-w-0 flex-col gap-3 self-start rounded-2xl bg-card p-3 pop-static",
        className,
      )}
    >
      <div
        ref={frameRef}
        className={cn(
          "relative w-full overflow-hidden rounded-xl ink-border",
          aspect,
          toneBg[tone],
        )}
      >
        {showEmbed && showPlayGate ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play Ivy's ${label} video${post.adminLabel ? ` — ${post.adminLabel}` : ""}`}
            className="group absolute inset-0 h-full w-full"
          >
            {usePoster ? (
              <img
                src={post.thumbnailUrl ?? ""}
                alt={
                  post.originalCaption ??
                  `Ivy in an official ${label} video from @${post.sourceAccountHandle}`
                }
                loading="eager"
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setPosterBroken(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden className="absolute inset-0 flex items-center justify-center gap-2">
                <CrownDoodle className="h-6 w-10 text-ivy/70" />
                <PawDoodle className="h-6 w-6 text-charcoal/40" />
              </span>
            )}
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center bg-charcoal/10 transition-colors group-hover:bg-charcoal/25"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 ink-border transition-transform motion-safe:group-hover:scale-110">
                <Play className="ml-0.5 h-6 w-6 text-ivy" />
              </span>
            </span>
          </button>
        ) : showEmbed ? (

          <>
            {!loaded ? (
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center gap-2 motion-safe:animate-pulse"
              >
                <CrownDoodle className="h-5 w-8 text-ivy/60" />
                <PawDoodle className="h-5 w-5 text-charcoal/40" />
              </div>
            ) : null}
            {inView || playing ? (
              <iframe
                src={embedSrc}
                title={`Official ${label} post from @${post.sourceAccountHandle}${
                  post.adminLabel ? ` — ${post.adminLabel}` : ""
                }`}
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                scrolling="no"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                className={cn(
                  "absolute inset-0 h-full w-full border-0 bg-card transition-opacity duration-300",
                  loaded ? "opacity-100" : "opacity-0",
                )}
              />
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <span aria-hidden className="flex items-center gap-2">
              {post.platform === "tiktok" ? (
                <Play className="h-6 w-6 text-charcoal" />
              ) : (
                <CrownDoodle className="h-5 w-8 text-ivy" />
              )}
              <PawDoodle className="h-5 w-5 text-charcoal/70" />
            </span>
            <Sticker tone={post.platform === "tiktok" ? "lavender" : "pink"}>
              <FrogDoodle className="h-3.5 w-4 text-ivy" />
              {label}
            </Sticker>
            <p className="max-w-[24ch] font-display text-sm leading-tight text-charcoal">
              {fallbackLabel}
            </p>
            {failed ? (
              <p className="text-xs text-charcoal/70">
                This post can&apos;t be shown here right now — open it on {label}.
              </p>
            ) : null}
            {!failed ? <span className="text-xs text-charcoal/70">Open the original post from the link below.</span> : null}
          </div>
        )}
      </div>

      {post.originalCaption && !compact ? (
        <p className="line-clamp-2 text-xs leading-snug text-charcoal/80">
          {post.originalCaption}
        </p>
      ) : null}


      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <a
          href={post.originalPostUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1 font-display text-ivy underline underline-offset-4"
        >
          View original post
          <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
        </a>
        {!compact ? (
          <span className="text-charcoal/70">@{post.sourceAccountHandle}</span>
        ) : null}
      </figcaption>

      {!embedsAllowed && !compact ? (
        <button
          type="button"
          onClick={openSettings}
          className="self-start text-[0.7rem] text-charcoal/70 underline underline-offset-4"
        >
          Cookie settings
        </button>
      ) : null}
    </figure>
  );
}

const toneBg = {
  leaf: "bg-leaf",
  cream: "bg-card",
  lavender: "bg-lavender",
  yellow: "bg-yellow",
  pink: "bg-pink",
} as const;

/** Short, honest note used under curated sections. */
export function CuratedNote({ className }: { className?: string }) {
  return (
    <p className={cn("rounded-xl bg-yellow p-4 text-sm text-charcoal pop-static", className)}>
      These posts are hand-picked from Ivy&apos;s official public accounts and shown with
      Instagram and TikTok&apos;s own embeds, so her original captions stay exactly as she wrote
      them. Nothing is copied or re-hosted here, and this is not a live automatic feed.
      Instagram and TikTok do not sponsor or endorse this project.
    </p>
  );
}
