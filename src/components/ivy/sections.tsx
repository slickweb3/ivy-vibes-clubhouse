import { useMemo, useRef } from "react";
import { ExternalLinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, MediaPlaceholder, ApprovedMedia, Polaroid, InfoCard, Sticker, StatusChip, ComingSoonPill } from "./primitives";
import {
  displayCaption,
  isVideoLike,
  type SiteMedia,
  type UnifiedMediaItem,
} from "@/types/media";
import { CrownDoodle, FrogDoodle, GrassStrip, LeafDoodle, PawDoodle } from "./doodles";
import { useEmbedConsent } from "./cookie-consent";
import { OfficialSocialEmbed, CuratedNote } from "./official-embed";
import { Reveal } from "./reveal";

import { platformLabel, type CuratedPost } from "@/types/curated";

import {
  freshPosts,
  hallOfFameCaptions,
  heroCopy,
  ivyTv,
  ivyTvItems,
  loreChapters,
  meetIvy,
  tokenRecord,
  whyIvy,
} from "@/data/site-content";
import {
  COMING_SOON,
  displayValue,
  explorerUrl,
  hasVerifiedContract,
  projectConfig,
  shortenAddress,
} from "@/config/project";
import type { MarketSnapshot } from "@/lib/market.server";
import { MiniChart } from "@/components/ivy/mini-chart";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Hero */

export function Hero({
  media,
  market,
  curatedHero,
}: {
  media?: UnifiedMediaItem | null;
  market?: MarketSnapshot | null;
  curatedHero?: CuratedPost | null;
}) {

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-leaf band-leaf">
      <div className="pointer-events-none absolute -top-10 -right-8 hidden opacity-70 sm:block">
        <LeafDoodle className="h-40 w-40 text-frog float-slow" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8">
        <Reveal>
          <Sticker tone="yellow">
            <CrownDoodle className="h-3.5 w-5 text-frog" />
            {heroCopy.badge}
          </Sticker>

          <h1 id="hero-title" className="mt-5 text-fluid-hero text-balance text-charcoal">
            <span className="block">{heroCopy.headlineLine1}</span>
            <span className="block text-ivy">{heroCopy.headlineLine2}</span>
          </h1>

          <div aria-hidden className="brand-rule mt-6 w-32" />

          <p className="measure mt-5 text-base leading-relaxed text-charcoal/90 sm:text-lg">
            {heroCopy.body}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="min-h-12 rounded-full bg-frog px-6 font-display text-base text-charcoal pop hover:bg-frog">
              <a href="#meet-ivy">Meet the Queen</a>
            </Button>
            <Button
              asChild
              className="min-h-12 rounded-full bg-yellow px-6 font-display text-base text-charcoal pop hover:bg-yellow"
            >
              <a
                href="https://pump.fun/coin/9m63AW5py9AQK218vxX4zEXp8gyFT2Cc9ZMnt6Fppump"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy $ivy on pump.fun
              </a>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {heroCopy.stickers.map((sticker, index) => (
              <li key={sticker}>
                <Sticker tone={(["pink", "lavender", "yellow", "cream", "frog"] as const)[index % 5]} float>
                  {sticker}
                </Sticker>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal variant="zoom" delay={120} className="relative">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Sticker tone="yellow" className="rotate-[-4deg]">
                <FrogDoodle className="h-4 w-5 text-ivy" /> Frog Queen
              </Sticker>
            </li>
            <li>
              <Sticker tone="pink" className="rotate-[3deg]">
                <PawDoodle className="h-4 w-4 text-charcoal" /> Short Spine Queen
              </Sticker>
            </li>
          </ul>


          {market ? (
            <div className="mt-8 -rotate-1">
              <MiniChart snapshot={market} />
            </div>
          ) : null}
        </Reveal>
      </div>

      <GrassStrip />
    </section>
  );
}


/* -------------------------------------------------------------- Meet Ivy */

export function MeetIvy() {
  return (
    <Section
      id="meet-ivy"
      eyebrow="Meet Ivy"
      title={meetIvy.heading}
      intro={meetIvy.body}
      tone="cream"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {meetIvy.cards.map((card) => (
          <InfoCard key={card.title} title={card.title} body={card.body} tone={card.tone} />
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------- Fresh from the Queen */

export function FreshFromTheFrogQueen({
  media,
  curated = [],
}: {
  media: SiteMedia;
  curated?: CuratedPost[];
}) {
  const { postsPerPlatform } = projectConfig.socialFeed;
  const trackRef = useRef<HTMLUListElement>(null);

  const importedPlatforms = [
    {
      key: "instagram" as const,
      label: "Instagram",
      heading: "Latest on Instagram",
      slotLabel: "Official Ivy Reel",
      posts: media.freshPosts.instagram,
      connection: media.connections.instagram,
    },
    {
      key: "tiktok" as const,
      label: "TikTok",
      heading: "Latest on TikTok",
      slotLabel: "Official Ivy video",
      posts: media.freshPosts.tiktok,
      connection: media.connections.tiktok,
    },
  ].filter((platform) => platform.posts.length > 0);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <Section
      id="fresh-posts"
      eyebrow="Hand-picked"
      title={freshPosts.heading}
      intro={freshPosts.body}
      tone="white"
    >
      {curated.length > 0 ? (
        <>
          <ul
            ref={trackRef}
            aria-label="Curated official posts from Ivy's accounts"
            className="rail flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3"
          >
            {curated.map((post) => (
              <li key={post.id} className="rail-item w-[80%] min-w-0 shrink-0 sm:w-auto">
                <OfficialSocialEmbed post={post} tone={post.platform === "tiktok" ? "lavender" : "leaf"} />
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2 sm:hidden">
            <Button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous post"
              className="min-h-11 min-w-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-leaf"
            >
              &lsaquo; Previous
            </Button>
            <Button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next post"
              className="min-h-11 min-w-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-leaf"
            >
              Next &rsaquo;
            </Button>
          </div>
        </>
      ) : null}

      {curated.length === 0 && importedPlatforms.length > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {importedPlatforms.map((platform) => (
            <PlatformFeed
              key={platform.key}
              label={platform.label}
              heading={platform.heading}
              slotLabel={platform.slotLabel}
              posts={platform.posts}
              connection={platform.connection}
              count={postsPerPlatform}
              lastUpdated={media.lastUpdated}
            />
          ))}
        </div>
      ) : null}

      <CuratedNote className="mt-6" />
    </Section>
  );
}


function PlatformFeed({
  label,
  heading,
  slotLabel,
  posts,
  connection,
  count,
  lastUpdated,
}: {
  label: string;
  heading: string;
  slotLabel: string;
  posts: UnifiedMediaItem[];
  connection: SiteMedia["connections"]["instagram"];
  count: number;
  lastUpdated: string | null;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const connected = connection.status === "connected";

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  const slots = 0;

  return (
    <div className="rounded-2xl bg-card p-5 pop-static">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-charcoal">{heading}</h3>
        <StatusChip
          status={connected ? "ok" : connection.status === "expired" ? "pending" : "off"}
          label={
            connected
              ? connection.accountName
                ? `Connected · @${connection.accountName}`
                : "Connected"
              : connection.status === "expired"
                ? "Authorization expired"
                : "Not connected"
          }
        />
      </div>

      <p className="mt-2 text-sm text-charcoal/80">
        {posts.length > 0
          ? `Straight from Ivy's official ${label} account, captions in her own words.`
          : connected
            ? freshPosts.loading
            : `Ivy's official ${label} account has not been connected yet. Nothing here is scraped or guessed.`}
      </p>

      <ul
        ref={trackRef}
        aria-label={`${label} posts`}
        className="rail mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0"
      >
        {posts.map((post) => (
          <li key={post.key} className="rail-item w-[72%] min-w-0 shrink-0 sm:w-auto">
            <PostCard post={post} />
          </li>
        ))}
        {Array.from({ length: slots }).map((_, index) => (
          <li key={`slot-${index}`} className="rail-item w-[72%] min-w-0 shrink-0 sm:w-auto">
              <MediaPlaceholder
              label={slotLabel}
              aspect="square"
              tone={index === 1 ? "lavender" : "leaf"}
              compact
            />
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2 sm:hidden">
        <Button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label={`Previous ${label} post`}
          className="min-h-11 min-w-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-leaf"
        >
          &lsaquo; Previous
        </Button>
        <Button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={`Next ${label} post`}
          className="min-h-11 min-w-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-leaf"
        >
          Next &rsaquo;
        </Button>
      </div>

      <p className="mt-4 text-xs text-charcoal/70">
        Served from this site&apos;s own cache. Last updated:{" "}
        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : COMING_SOON}.
      </p>
    </div>
  );
}

/** One imported post. Ivy's original caption is the primary copy. */
export function PostCard({ post }: { post: UnifiedMediaItem }) {
  const caption = displayCaption(post);
  return (
    <figure className="flex h-full flex-col gap-2">
      <ApprovedMedia item={post} label="Official Ivy post" aspect="square" tone="leaf" compact />
      {caption ? (
        <figcaption className="line-clamp-3 text-sm leading-snug text-charcoal/85">
          {caption}
        </figcaption>
      ) : null}
      {post.permalink ? (
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 font-display text-xs text-ivy underline underline-offset-4"
        >
          View original post
          <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </figure>
  );
}

/* ----------------------------------------------------------------- Ivy TV */

export function IvyTV({
  items: approved = [],
  curated = [],
}: {
  items?: UnifiedMediaItem[];
  curated?: CuratedPost[];
}) {
  const { embedsAllowed, openSettings } = useEmbedConsent();
  const curatedFeatured = curated.find((post) => post.isFeatured) ?? curated[0] ?? null;
  const curatedRest = curated.filter((post) => post.id !== curatedFeatured?.id);


  const approvedVideos = useMemo(
    () => approved.filter((item) => isVideoLike(item) || item.mediaKind === "image"),
    [approved],
  );

  const items = ivyTvItems;

  const featuredApproved =
    approvedVideos.find((item) => item.isFeatured) ?? approvedVideos[0] ?? null;
  const featured = ivyTvItems.find((item) => item.isFeatured);


  return (
    <Section
      id="ivy-tv"
      eyebrow="Ivy TV"
      title={ivyTv.heading}
      intro={ivyTv.subtitle}
      tone="ivy"
      headingClassName="text-cream"
    >
      {featured ? (
        <div className="mb-10 grid gap-6 rounded-2xl bg-card p-5 pop-static lg:grid-cols-[1.4fr_1fr]">
          {curatedFeatured ? (
            <OfficialSocialEmbed post={curatedFeatured} tone="lavender" className="mx-auto w-full max-w-sm" />
          ) : (
            <ApprovedMedia
              item={featuredApproved}
              label={featured.mediaLabel}
              aspect="video"
              tone="leaf"
              hint="Featured episode slot"
            />
          )}
          <div className="flex flex-col justify-center gap-3">
            <Sticker tone="yellow">Featured episode</Sticker>
            <h3 className="font-display text-2xl text-charcoal">
              {curatedFeatured || featuredApproved ? "Straight from the Frog Queen" : featured.title}
            </h3>
            <p className="text-sm text-charcoal/85">
              {curatedFeatured
                ? `Hand-picked from Ivy's official ${platformLabel(curatedFeatured.platform)} account. Her original caption plays inside the official embed.`
                : featuredApproved
                  ? displayCaption(featuredApproved) || featured.caption
                  : featured.caption}
            </p>
            <p className="text-sm text-charcoal/70">
              {embedsAllowed
                ? "Embeds are allowed, so the official player loads directly from the platform."
                : "Player embeds are switched off in cookie settings, but every card still links to the original post."}
            </p>
            {!embedsAllowed ? (
              <Button
                onClick={openSettings}
                className="min-h-11 w-fit rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
              >
                Cookie settings
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {curatedRest.length > 0 ? (
        <ul className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {curatedRest.map((post) => (
            <li key={post.id}>
              <OfficialSocialEmbed post={post} tone="lavender" compact />
            </li>
          ))}
        </ul>
      ) : null}





      {curated.length === 0 && approvedVideos.length > 0 ? (
        <ul className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {approvedVideos.map((item) => (
            <li key={item.key} data-tilt className="rounded-2xl bg-card p-4 pop-static">
              <ApprovedMedia item={item} label="Approved Ivy video" aspect="tall" tone="leaf" compact />
              <p className="mt-3 line-clamp-3 text-sm text-charcoal/85">{displayCaption(item)}</p>
              <div className="mt-3 flex items-center gap-2">
                {item.permalink ? (
                  <a
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lavender px-3 font-display text-xs text-charcoal"
                  >
                    <Play aria-hidden className="h-3.5 w-3.5" />
                    Watch on {item.platform === "tiktok" ? "TikTok" : "Instagram"}
                  </a>
                ) : (
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lavender px-3 font-display text-xs text-charcoal">
                    <Play aria-hidden className="h-3.5 w-3.5" /> Approved clip
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Placeholder rail only appears while no curated official clips exist. */}
      {curated.length === 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} data-tilt className="rounded-2xl bg-card p-4 pop-static">
              <MediaPlaceholder label={item.mediaLabel} aspect="tall" tone="leaf" compact />
              <h3 className="mt-3 font-display text-base text-charcoal">{item.title}</h3>
              <p className="mt-1 text-sm text-charcoal/80">{item.caption}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lavender px-3 font-display text-xs text-charcoal">
                  <Play aria-hidden className="h-3.5 w-3.5" />
                {item.videoUrl ? "Play" : "Official clip"}
                </span>
                <span className="text-xs text-charcoal/70">{item.category}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

    </Section>
  );
}

/* ----------------------------------------------------------- Hall of Fame */

export function HallOfFame({
  items = [],
  curated = [],
}: {
  items?: UnifiedMediaItem[];
  curated?: CuratedPost[];
}) {
  return (
    <Section
      id="hall-of-fame"
      eyebrow="Scrapbook"
      title="The Ivy Hall of Fame"
      intro="A scrapbook wall of hand-picked posts from Ivy's official Instagram, shown with Instagram's own embeds."
      tone="lavender"
    >
      {curated.length > 0 ? (
        <ul className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {curated.map((post, index) => (
            <li
              key={post.id}
              style={{ transform: `rotate(${index % 3 === 0 ? -1.5 : index % 3 === 1 ? 1.5 : -0.5}deg)` }}
            >
              <OfficialSocialEmbed post={post} tone={index % 2 === 0 ? "cream" : "yellow"} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">

        {items.map((item, index) => (
          <Polaroid
            key={item.key}
            item={item}
            label="Approved Ivy photo"
            caption={displayCaption(item) || hallOfFameCaptions[index % hallOfFameCaptions.length]}
            rotate={index % 3 === 0 ? -2.5 : index % 3 === 1 ? 1.5 : -1}
            tone={(["leaf", "cream", "yellow", "pink"] as const)[index % 4]}
            aspect={index % 4 === 0 ? "portrait" : "square"}
            className="break-inside-avoid"
          />
        ))}
        {(curated.length > 0
          ? []
          : hallOfFameCaptions.slice(0, Math.max(hallOfFameCaptions.length - items.length, 0))
        ).map((caption, index) => (
          <Polaroid
            key={caption}
            label={`Approved Ivy photo ${index + 1}`}
            caption={caption}
            rotate={index % 3 === 0 ? -2.5 : index % 3 === 1 ? 1.5 : -1}
            tone={(["leaf", "cream", "yellow", "pink"] as const)[index % 4]}
            aspect={index % 4 === 0 ? "portrait" : "square"}
            className="break-inside-avoid"
          />
        ))}

      </div>
      <p className="mt-8 text-sm text-cream/85">
        A moderated community submission form will open once moderation is in place.
      </p>

    </Section>
  );
}

/* --------------------------------------------------------------- The Lore */

export function TheLore() {
  return (
    <Section
      id="the-lore"
      eyebrow="The Lore"
      title="The Legend of the Short Spine Queen"
      intro="Ivy's story, told as chapters. Exact dates are omitted until Ivy's family confirms them."
      tone="cream"
    >
      <ol className="relative space-y-6 border-l-[3px] border-charcoal/80 pl-6">
        {loreChapters.map((chapter, index) => (
          <li key={chapter} className="relative">
            <span
              aria-hidden
              className="absolute -left-[2.15rem] flex h-7 w-7 items-center justify-center rounded-full bg-frog ink-border"
            >
              <PawDoodle className="h-3.5 w-3.5 text-charcoal" />
            </span>
            <div className="rounded-2xl bg-card p-4 pop-static">
              <p className="font-display text-xs tracking-[0.2em] text-charcoal/60 uppercase">
                Chapter {index + 1} · date {COMING_SOON}
              </p>
              <h3 className="mt-1 font-display text-lg text-charcoal">{chapter}</h3>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* --------------------------------------------------------------- Why $ivy */

export function WhyIvy() {
  return (
    <Section id="why-ivy" eyebrow="Why $ivy" title={whyIvy.heading} intro={whyIvy.body} tone="leaf">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whyIvy.cards.map((card) => (
          <InfoCard key={card.title} title={card.title} body={card.body} tone={card.tone} />
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-card p-5 pop-static">
        <h3 className="font-display text-lg text-charcoal">Transparency</h3>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{whyIvy.transparencyPanel}</p>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------- Token record */

export function TokenRecord({ market }: { market?: MarketSnapshot }) {
  // Live database values win over the static defaults; anything missing in
  // both stays "Coming Soon".
  const live = market?.config;
  const config = {
    ...projectConfig,
    blockchain: live?.blockchain ?? projectConfig.blockchain,
    contractAddress: live?.contractAddress ?? projectConfig.contractAddress,
    launchDate: (() => {
      const raw = live?.launchDate ?? projectConfig.launchDate;
      if (!raw) return raw;
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : null;
      return iso
        ? iso.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
        : raw;
    })(),
    tokenSupply: live?.tokenSupply ?? projectConfig.tokenSupply,
    launchPlatform: live?.launchPlatform ?? projectConfig.launchPlatform,
  };
  const verified = hasVerifiedContract(config);
  const explorer = explorerUrl(config);
  const rows = [
    { label: "Token name", value: config.projectName },
    { label: "Ticker", value: config.ticker },
    { label: "Blockchain", value: displayValue(config.blockchain) },
    { label: "Launch platform", value: displayValue(config.launchPlatform) },
    { label: "Contract address", value: shortenAddress(config.contractAddress) },
    { label: "Total supply", value: displayValue(config.tokenSupply) },
    { label: "Buy / sell tax", value: "0% / 0%" },
    { label: "Launch date", value: displayValue(config.launchDate) },
    {
      label: "Tokenomics",
      value: config.tokenomicsUrl
        ? "Fair launch · no presale · no team allocation · 0% tax"
        : COMING_SOON,
    },
    { label: "Record last updated", value: displayValue(config.tokenRecordUpdatedAt) },
  ];


  return (
    <Section
      id="token-record"
      eyebrow="$ivy"
      title={tokenRecord.heading}
      intro="Nothing here is estimated. Every unconfirmed field stays marked Coming Soon."
      tone="white"
    >
      <div className="overflow-hidden rounded-2xl bg-card pop-static">
        <table className="w-full text-left">
          <caption className="sr-only">Official $ivy token record</caption>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-charcoal/10 last:border-0">
                <th scope="row" className="w-1/2 p-4 font-display text-sm text-charcoal sm:text-base">
                  {row.label}
                </th>
                <td className="p-4 text-sm text-charcoal/90 sm:text-base">
                  {row.value === COMING_SOON ? <ComingSoonPill /> : row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StatusChip
          status={verified ? "ok" : "pending"}
          label={verified ? "Contract published" : "Contract not published yet"}
        />
        {verified && explorer ? (
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-frog px-5 font-display text-sm text-charcoal pop"
          >
            <ExternalLinkIcon aria-hidden className="h-4 w-4" />
            View on explorer
          </a>
        ) : (
          <Button
            disabled
            className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog disabled:opacity-70"
          >
            <ExternalLinkIcon aria-hidden className="h-4 w-4" />
            Contract Coming Soon
          </Button>
        )}
        {market?.pairUrl ? (
          <a
            href="#live-chart"
            className="inline-flex min-h-11 items-center rounded-full bg-yellow px-5 font-display text-sm text-charcoal pop"
          >
            See the live chart
          </a>
        ) : null}
      </div>

      <div className="mt-8">
        <h3 className="font-display text-xl text-charcoal sm:text-2xl">{tokenRecord.planHeading}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-charcoal/85">
          {tokenRecord.planNote}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tokenRecord.plan.map((card) => (
            <InfoCard key={card.title} title={card.title} body={card.body} tone={card.tone} />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-leaf p-5 pop-static">
        <h3 className="font-display text-lg text-charcoal">{tokenRecord.purposeHeading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{tokenRecord.purposeBody}</p>
        <p className="mt-3 text-xs leading-relaxed text-charcoal/70">
          {tokenRecord.purposeDisclaimer}
        </p>
      </div>

      <p className="mt-5 rounded-xl bg-pink p-4 font-display text-sm text-charcoal pop-static">
        {tokenRecord.warning}
      </p>
    </Section>
  );
}
