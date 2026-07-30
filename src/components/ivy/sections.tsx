import { useMemo, useState } from "react";
import { ExternalLinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, MediaPlaceholder, Polaroid, InfoCard, Sticker, StatusChip, ComingSoonPill } from "./primitives";
import { CrownDoodle, FrogDoodle, GrassStrip, LeafDoodle, PawDoodle, VineDivider } from "./doodles";
import { useEmbedConsent } from "./cookie-consent";
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
  type IvyTvCategory,
} from "@/data/site-content";
import {
  COMING_SOON,
  displayValue,
  hasVerifiedContract,
  projectConfig,
  shortenAddress,
} from "@/config/project";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Hero */

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-leaf">
      <div className="pointer-events-none absolute -top-10 -right-8 hidden opacity-70 sm:block">
        <LeafDoodle className="h-40 w-40 text-frog float-slow" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
        <div>
          <Sticker tone="yellow">
            <CrownDoodle className="h-3.5 w-5 text-frog" />
            {heroCopy.badge}
          </Sticker>

          <h1
            id="hero-title"
            className="mt-5 text-[3rem] leading-[0.9] text-charcoal sm:text-[4.5rem] lg:text-[5.25rem]"
          >
            <span className="block">{heroCopy.headlineLine1}</span>
            <span className="block text-ivy">{heroCopy.headlineLine2}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-charcoal/90 sm:text-lg">
            {heroCopy.body}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="min-h-12 rounded-full bg-frog px-6 font-display text-base text-charcoal pop hover:bg-frog">
              <a href="#meet-ivy">Meet the Queen</a>
            </Button>
            <Button
              disabled
              aria-disabled="true"
              title="Token details are not confirmed yet"
              className="min-h-12 rounded-full bg-cream px-6 font-display text-base text-charcoal pop-static hover:bg-cream disabled:opacity-80"
            >
              $IVY Coming Soon
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap gap-2">
            {heroCopy.stickers.map((sticker, index) => (
              <li key={sticker}>
                <Sticker tone={(["pink", "lavender", "yellow", "cream", "frog"] as const)[index % 5]} float>
                  {sticker}
                </Sticker>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="relative rotate-1">
            <MediaPlaceholder
              label={heroCopy.mediaLabel}
              hint="Photo or video supplied by Ivy's owner"
              aspect="portrait"
              tone="cream"
              className="mx-auto max-w-md"
            />
          </div>
          <Sticker tone="yellow" className="absolute -top-3 -left-2 rotate-[-8deg]">
            <FrogDoodle className="h-4 w-5 text-ivy" /> Frog Queen
          </Sticker>
          <Sticker tone="pink" className="absolute -bottom-3 right-2 rotate-[6deg]">
            <PawDoodle className="h-4 w-4 text-charcoal" /> Short Spine Queen
          </Sticker>
        </div>
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

      <VineDivider className="my-12" />

      <div className="grid gap-8 md:grid-cols-3">
        {meetIvy.editorial.map((item, index) => (
          <article key={item.heading} className="flex flex-col gap-4">
            <Polaroid
              label={item.mediaLabel}
              caption={item.heading}
              rotate={index % 2 === 0 ? -2 : 2}
              tone={index === 1 ? "lavender" : "leaf"}
            />
            <p className="text-sm leading-relaxed text-charcoal/85">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------- Fresh from the Queen */

export function FreshFromTheFrogQueen() {
  const { instagramEnabled, tiktokEnabled, postsPerPlatform } = projectConfig.socialFeed;

  const platforms = [
    { key: "instagram", label: "Instagram", enabled: instagramEnabled },
    { key: "tiktok", label: "TikTok", enabled: tiktokEnabled },
  ] as const;

  return (
    <Section
      id="fresh-posts"
      eyebrow="Live feed"
      title={freshPosts.heading}
      intro={freshPosts.body}
      tone="white"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformFeed
            key={platform.key}
            label={platform.label}
            enabled={platform.enabled}
            count={postsPerPlatform}
          />
        ))}
      </div>

      <p className="mt-6 rounded-xl bg-yellow p-4 text-sm text-charcoal pop-static">
        {freshPosts.empty} Instagram and TikTok do not sponsor or endorse this project.
      </p>
    </Section>
  );
}

function PlatformFeed({
  label,
  enabled,
  count,
}: {
  label: string;
  enabled: boolean;
  count: number;
}) {
  const trackRef = useRef<HTMLUListElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="rounded-2xl bg-cream p-5 pop-static">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-charcoal">{label}</h3>
        <StatusChip
          status={enabled ? "pending" : "off"}
          label={enabled ? "Awaiting first sync" : "Not connected"}
        />
      </div>

      <p className="mt-2 text-sm text-charcoal/80">
        {enabled
          ? freshPosts.loading
          : `Ivy's official ${label} account has not been connected yet. Nothing here is scraped or guessed.`}
      </p>

      <ul
        ref={trackRef}
        aria-label={`${label} placeholder posts`}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0"
      >
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className="w-[70%] shrink-0 snap-start sm:w-auto">
            <MediaPlaceholder
              label={`${label} slot ${index + 1}`}
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
          aria-label={`Scroll ${label} placeholders backwards`}
          className="min-h-11 min-w-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-leaf"
        >
          ‹
        </Button>
        <Button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={`Scroll ${label} placeholders forwards`}
          className="min-h-11 min-w-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-leaf"
        >
          ›
        </Button>
      </div>

      <p className="mt-4 text-xs text-charcoal/70">
        Feed served from this site's own cache via <code>/api/social-feed</code>. Last updated:{" "}
        {COMING_SOON}.
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------- Ivy TV */

export function IvyTV() {
  const [category, setCategory] = useState<IvyTvCategory>("All");
  const { embedsAllowed, openSettings } = useEmbedConsent();

  const items = useMemo(
    () => (category === "All" ? ivyTvItems : ivyTvItems.filter((item) => item.category === category)),
    [category],
  );

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
        <div className="mb-10 grid gap-6 rounded-2xl bg-cream p-5 pop-static lg:grid-cols-[1.4fr_1fr]">
          <MediaPlaceholder
            label={featured.mediaLabel}
            aspect="video"
            tone="leaf"
            hint="Featured episode slot"
          />
          <div className="flex flex-col justify-center gap-3">
            <Sticker tone="yellow">Featured episode</Sticker>
            <h3 className="font-display text-2xl text-charcoal">{featured.title}</h3>
            <p className="text-sm text-charcoal/85">{featured.caption}</p>
            <p className="text-sm text-charcoal/70">
              {embedsAllowed
                ? "Embeds are allowed. The player will appear once an approved video is linked."
                : "Video embeds are switched off. You will see a thumbnail, the caption and a link to the original post."}
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

      <div role="tablist" aria-label="Ivy TV categories" className="mb-6 flex flex-wrap gap-2">
        {ivyTv.categories.map((tab) => {
          const selected = tab === category;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setCategory(tab)}
              className={cn(
                "min-h-11 rounded-full px-4 font-display text-sm pop-static transition-colors",
                selected ? "bg-frog text-charcoal" : "bg-cream/90 text-charcoal hover:bg-leaf",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-cream p-4 pop-static">
            <MediaPlaceholder label={item.mediaLabel} aspect="tall" tone="leaf" compact />
            <h3 className="mt-3 font-display text-base text-charcoal">{item.title}</h3>
            <p className="mt-1 text-sm text-charcoal/80">{item.caption}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lavender px-3 font-display text-xs text-charcoal">
                <Play aria-hidden className="h-3.5 w-3.5" />
                {item.videoUrl ? "Play" : "Awaiting video"}
              </span>
              <span className="text-xs text-charcoal/70">{item.category}</span>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ----------------------------------------------------------- Hall of Fame */

export function HallOfFame() {
  return (
    <Section
      id="hall-of-fame"
      eyebrow="Scrapbook"
      title="The Ivy Hall of Fame"
      intro="A community scrapbook wall. Every frame is reserved for an owner-approved photograph of the real Ivy."
      tone="lavender"
    >
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {hallOfFameCaptions.map((caption, index) => (
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
      <p className="mt-8 text-sm text-charcoal/80">
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

/* --------------------------------------------------------------- Why $IVY */

export function WhyIvy() {
  return (
    <Section id="why-ivy" eyebrow="Why $IVY" title={whyIvy.heading} intro={whyIvy.body} tone="leaf">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whyIvy.cards.map((card) => (
          <InfoCard key={card.title} title={card.title} body={card.body} tone={card.tone} />
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-cream p-5 pop-static">
        <h3 className="font-display text-lg text-charcoal">Transparency</h3>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{whyIvy.transparencyPanel}</p>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------- Token record */

export function TokenRecord() {
  const verified = hasVerifiedContract();
  const rows = [
    { label: "Token name", value: projectConfig.projectName },
    { label: "Ticker", value: projectConfig.ticker },
    { label: "Blockchain", value: displayValue(projectConfig.blockchain) },
    { label: "Contract address", value: shortenAddress(projectConfig.contractAddress) },
    { label: "Total supply", value: displayValue(projectConfig.tokenSupply) },
    { label: "Launch date", value: displayValue(projectConfig.launchDate) },
    { label: "Tokenomics", value: displayValue(projectConfig.tokenomicsUrl) },
    { label: "Record last updated", value: displayValue(projectConfig.tokenRecordUpdatedAt) },
  ];

  return (
    <Section
      id="token-record"
      eyebrow="$IVY"
      title={tokenRecord.heading}
      intro="Nothing here is estimated. Every unverified field stays marked Coming Soon."
      tone="white"
    >
      <div className="overflow-hidden rounded-2xl bg-cream pop-static">
        <table className="w-full text-left">
          <caption className="sr-only">Official $IVY token record</caption>
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
        <Button
          disabled={!verified}
          className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog disabled:opacity-70"
        >
          <ExternalLinkIcon aria-hidden className="h-4 w-4" />
          {verified ? "View on explorer" : "Explorer link coming soon"}
        </Button>
      </div>

      <p className="mt-5 rounded-xl bg-pink p-4 font-display text-sm text-charcoal pop-static">
        {tokenRecord.warning}
      </p>
    </Section>
  );
}
