import { useState } from "react";
import { ExternalLinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmbedConsent } from "./cookie-consent";
import { Sticker } from "./primitives";
import { CrownDoodle, FrogDoodle, PawDoodle } from "./doodles";
import {
  curatedFallbackLabel,
  platformLabel,
  type CuratedPost,
} from "@/types/curated";
import { cn } from "@/lib/utils";

/**
 * Renders one curated post using the platform's OWN official embed.
 *
 * Nothing is downloaded, proxied or rehosted: the iframe points straight at
 * Instagram / TikTok, and Ivy's original caption is shown by the platform
 * inside that frame. Before consent (or an explicit click) only a branded
 * card with a direct link is rendered — no third-party request is made.
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
  const [loadRequested, setLoadRequested] = useState(false);
  const [failed, setFailed] = useState(false);

  const label = platformLabel(post.platform);
  const fallbackLabel = curatedFallbackLabel(post);
  const showEmbed = (embedsAllowed || loadRequested) && !failed;
  const aspect = post.platform === "tiktok" ? "aspect-[9/16]" : "aspect-[4/5]";

  return (
    <figure
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl bg-card p-3 pop-static",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl ink-border",
          aspect,
          toneBg[tone],
        )}
      >
        {showEmbed ? (
          <iframe
            src={post.officialEmbedUrl}
            title={`Official ${label} post from @${post.sourceAccountHandle}${
              post.adminLabel ? ` — ${post.adminLabel}` : ""
            }`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            scrolling="no"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full border-0 bg-card"
          />
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
            {!failed ? (
              <Button
                type="button"
                onClick={() => setLoadRequested(true)}
                className="min-h-11 rounded-full bg-frog px-4 font-display text-xs text-charcoal pop hover:bg-frog"
              >
                Load official post
              </Button>
            ) : null}
          </div>
        )}
      </div>

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

      {!embedsAllowed && !loadRequested && !compact ? (
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
