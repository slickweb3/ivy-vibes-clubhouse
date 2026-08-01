import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpIcon, ExternalLinkIcon } from "lucide-react";
import { OfficialSocialEmbed } from "./official-embed";
import { Section, Sticker } from "./primitives";
import { FrogDoodle, PawDoodle } from "./doodles";
import { projectConfig } from "@/config/project";
import { platformLabel, type CuratedPost } from "@/types/curated";
import { cn } from "@/lib/utils";
import avatarTiktok from "@/assets/ivy-avatar-tiktok.png.asset.json";

/**
 * Two tall "profile windows" — one per official public account. Each one is
 * styled like the real app it mirrors and scrolls through Ivy's official
 * platform embeds. Nothing is scraped, copied or re-hosted: every post is
 * rendered by Instagram / TikTok themselves.
 */

interface ProfileMeta {
  displayName: string;
  handle: string;
  bio: string[];
  /** Owner-supplied profile numbers, shown with the date they were captured. */
  stats: { label: string; value: string }[];
  statsAsOf: string;
  urlLabel: string;
  avatar: string;
  profileUrl: string;
  tone: "lavender";
}

const TIKTOK: ProfileMeta = {
  displayName: "Ivy",
  handle: "ivyvibing",
  bio: ["Ivy has short spine syndrome", "My dms are broken"],
  stats: [
    { label: "following", value: "134" },
    { label: "followers", value: "4.7M" },
    { label: "likes", value: "144.7M" },
  ],
  statsAsOf: "1 Aug 2026",
  urlLabel: "tiktok.com/@ivyvibing",
  avatar: avatarTiktok.url,
  profileUrl: projectConfig.socials.tiktok ?? "https://www.tiktok.com/@ivyvibing",
  tone: "lavender",
};

export function SocialWindows({ posts }: { posts: CuratedPost[] }) {
  const tiktok = useMemo(() => posts.filter((post) => post.platform === "tiktok"), [posts]);

  if (tiktok.length === 0) return null;

  return (
    <Section
      id="social-windows"
      eyebrow="Straight from her account"
      title="Ivy's TikTok window"
      intro="A tall, scrollable window onto the Frog Queen's official TikTok. Her captions stay exactly as she wrote them, shown by TikTok itself."
      tone="lavender"
    >
      <div className="mx-auto max-w-2xl">
        <ProfileWindow posts={tiktok} />
      </div>
    </Section>
  );
}

function ProfileWindow({ posts }: { posts: CuratedPost[] }) {
  const meta = TIKTOK;
  const label = platformLabel("tiktok");
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(1);
  const [showTop, setShowTop] = useState(false);

  // Scroll progress + "which post am I on" — rAF throttled, no layout thrash.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = node.scrollHeight - node.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, node.scrollTop / max)) : 0;
      setProgress(ratio);
      setShowTop(node.scrollTop > 240);
      const mid = node.scrollTop + node.clientHeight / 2;
      let active = 1;
      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        if (item.offsetTop <= mid) active = index + 1;
      });
      setCurrent(active);
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
  }, [posts.length]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] bg-card ink-border pop-static">
      {/* Browser-ish chrome */}
      <div
        className={cn(
          "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b-2 border-charcoal/15 px-4 py-3",
          "bg-lavender",
        )}
      >
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
        </span>
        <span className="flex min-w-0 items-center gap-2 rounded-full bg-card/70 px-3 py-1">
          <FrogDoodle aria-hidden className="h-3.5 w-4 shrink-0 text-ivy" />
          <span className="truncate text-xs text-charcoal/80">{meta.urlLabel}</span>
        </span>
      </div>

      {/* Profile header, mirroring the real app layout */}
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="relative shrink-0">
            <img
              src={meta.avatar}
              alt={`Ivy's official ${label} profile picture`}
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 rounded-full bg-cream object-cover ink-border sm:h-24 sm:w-24"
            />
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-frog ink-border"
            >
              <PawDoodle className="h-3.5 w-3.5 text-charcoal" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl leading-tight text-charcoal">
              {meta.displayName}
            </p>
            <a
              href={meta.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm text-ivy underline underline-offset-4"
            >
              @{meta.handle}
            </a>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {meta.stats.map((stat) => (
                <span key={stat.label} className="text-sm text-charcoal/80">
                  <strong className="font-display text-charcoal">{stat.value}</strong>{" "}
                  {stat.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-0.5 text-sm text-charcoal/85">
          {meta.bio.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={meta.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pop inline-flex min-h-10 items-center gap-1.5 rounded-full bg-frog px-4 font-display text-charcoal"
          >
            Follow on {label}
            <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
          </a>
          <Sticker tone={meta.tone === "pink" ? "yellow" : "leaf"}>
            <FrogDoodle className="h-3.5 w-4 text-ivy" />
            {posts.length} {posts.length === 1 ? "post" : "posts"} in this window
          </Sticker>
        </div>
        <p className="text-[0.7rem] leading-snug text-charcoal/60">
          Profile numbers as shared by Ivy&apos;s owner on {meta.statsAsOf}. Live counts live on{" "}
          {label}.
        </p>
      </div>

      {/* Feed viewport */}
      <div className="flex items-center gap-3 border-y-2 border-charcoal/15 bg-leaf/40 px-4 py-2 sm:px-6">
        <span className="font-display text-xs uppercase tracking-wide text-charcoal">
          Official {label} feed
        </span>
        <span aria-live="polite" className="ml-auto text-xs text-charcoal/70">
          {current} / {posts.length}
        </span>
      </div>
      <div aria-hidden className="h-1.5 w-full bg-charcoal/10">
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
          className="social-window h-[34rem] overflow-y-auto overscroll-contain px-3 py-4 sm:h-[46rem] sm:px-5 lg:h-[54rem]"
        >
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            {posts.map((post, index) => (
              <li
                key={post.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                className="social-window-item"
              >
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
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent"
        />

        {showTop ? (
          <button
            type="button"
            onClick={scrollToTop}
            className="pop absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-yellow text-charcoal"
            aria-label={`Back to the top of Ivy's ${label} feed`}
          >
            <ArrowUpIcon aria-hidden className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-charcoal/15 px-4 py-3 text-xs sm:px-6">
        <span className="text-charcoal/70">
          Rendered by {label}&apos;s own embeds — nothing copied or re-hosted.
        </span>
        <a
          href={meta.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pop inline-flex min-h-9 items-center gap-1 rounded-full bg-frog px-3 font-display text-charcoal"
        >
          Open profile
          <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
