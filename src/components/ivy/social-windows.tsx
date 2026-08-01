import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { OfficialSocialEmbed } from "./official-embed";
import { Section, Sticker } from "./primitives";
import { FrogDoodle, PawDoodle } from "./doodles";
import { projectConfig } from "@/config/project";
import { platformLabel, type CuratedPlatform, type CuratedPost } from "@/types/curated";
import { cn } from "@/lib/utils";

/**
 * Two side-by-side "windows", each a live scrollable preview of one of Ivy's
 * official public accounts. Posts render through the platform's own official
 * embeds — nothing is scraped, copied or re-hosted.
 */
export function SocialWindows({ posts }: { posts: CuratedPost[] }) {
  const instagram = useMemo(
    () => posts.filter((post) => post.platform === "instagram"),
    [posts],
  );
  const tiktok = useMemo(
    () => posts.filter((post) => post.platform === "tiktok"),
    [posts],
  );

  if (instagram.length === 0 && tiktok.length === 0) return null;

  return (
    <Section
      id="social-windows"
      eyebrow="Straight from her accounts"
      title="Ivy's windows"
      intro="Two little windows into the Frog Queen's official Instagram and TikTok. Scroll each one — her captions stay exactly as she wrote them, shown by the platforms themselves."
      tone="leaf"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {instagram.length > 0 ? (
          <SocialWindow platform="instagram" posts={instagram} tone="pink" />
        ) : null}
        {tiktok.length > 0 ? (
          <SocialWindow platform="tiktok" posts={tiktok} tone="lavender" />
        ) : null}
      </div>
    </Section>
  );
}

function SocialWindow({
  platform,
  posts,
  tone,
}: {
  platform: CuratedPlatform;
  posts: CuratedPost[];
  tone: "pink" | "lavender";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const label = platformLabel(platform);
  const handle = posts[0]?.sourceAccountHandle ?? "";
  const profileUrl =
    (platform === "instagram" ? projectConfig.socials.instagram : projectConfig.socials.tiktok) ??
    posts[0]?.sourceAccountUrl ??
    "#";

  // Progress bar for the window's own scroll — cheap, rAF-throttled.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = node.scrollHeight - node.clientHeight;
      setProgress(max > 0 ? Math.min(1, node.scrollTop / max) : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl bg-card ink-border pop-static">
      {/* Window chrome */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 border-b-2 border-charcoal/15 px-4 py-3",
          tone === "pink" ? "bg-pink" : "bg-lavender",
        )}
      >
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base text-charcoal">
            {label}
          </span>
          {handle ? (
            <span className="block truncate text-xs text-charcoal/70">@{handle}</span>
          ) : null}
        </span>
        <Sticker tone={tone === "pink" ? "yellow" : "leaf"}>
          {platform === "tiktok" ? (
            <PawDoodle className="h-3.5 w-3.5 text-charcoal" />
          ) : (
            <FrogDoodle className="h-3.5 w-4 text-ivy" />
          )}
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </Sticker>
      </div>

      {/* Scroll progress */}
      <div aria-hidden className="h-1 w-full bg-charcoal/10">
        <div
          className="h-full bg-frog transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label={`Scrollable preview of Ivy's official ${label} posts`}
          className="social-window h-[26rem] overflow-y-auto overscroll-contain px-3 py-4 sm:h-[34rem] sm:px-4"
        >
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {posts.map((post) => (
              <li key={post.id} className="social-window-item">
                <OfficialSocialEmbed
                  post={post}
                  tone={platform === "tiktok" ? "lavender" : "cream"}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        </div>
        {/* Soft fade so the window reads as a viewport, not a cut-off list. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-charcoal/15 px-4 py-3 text-xs">
        <span className="text-charcoal/70">Official {label} embeds</span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pop inline-flex min-h-9 items-center gap-1 rounded-full bg-frog px-3 font-display text-charcoal"
        >
          Follow on {label}
          <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
