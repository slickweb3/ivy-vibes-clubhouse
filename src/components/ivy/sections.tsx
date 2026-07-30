import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Section, MediaPlaceholder, Sticker, Polaroid, ComingSoon } from "./primitives";
import { useEmbedConsent } from "./cookie-consent";
import { manualFallbackFeed, type SocialPost, type SocialFeedResponse } from "@/data/social";
import { projectConfig, displayValue, isConfigured } from "@/config/project";

/* ---------------- Meet Ivy ---------------- */

export function MeetIvy() {
  const facts = [
    { emoji: "👑", title: "Short Spine Queen", body: "A shorter spine, a bigger presence. Ivy takes up the whole room anyway." },
    { emoji: "🐸", title: "Frog Queen", body: "The signature frog-sit: back legs out, zero apologies, maximum comedy." },
    { emoji: "☀️", title: "Sunbeam Auditor", body: "Every warm patch of floor gets inspected, approved, then occupied." },
    { emoji: "🐾", title: "Chief Vibe Officer", body: "Runs the clubhouse on a strict schedule of snacks, naps and nonsense." },
  ];
  return (
    <Section
      id="meet-ivy"
      eyebrow="Meet the queen"
      title="Ivy, in her own words (translated)"
      intro="Ivy is a real dog with a real family. Everything on this page is about her — the coin is just the clubhouse membership card."
      tone="cream"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="grid gap-4 sm:grid-cols-2">
          {facts.map((f) => (
            <article key={f.title} className="rounded-2xl bg-card p-5 pop-static">
              <span aria-hidden="true" className="text-3xl">
                {f.emoji}
              </span>
              <h3 className="mt-3 text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Polaroid label="Portrait of Ivy" caption="Official royal portrait" rotate={-2} tone="lavender" />
          <Polaroid label="Ivy mid frog-sit" caption="The frog-sit, patented" rotate={2} tone="leaf" />
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Social feed + accessible modal ---------------- */

export function FreshFromTheFrogQueen() {
  const [feed, setFeed] = useState<SocialFeedResponse>({
    posts: manualFallbackFeed,
    source: "fallback",
    lastSyncedAt: null,
    live: false,
    notice: "Showing the owner-curated fallback feed.",
  });
  const [active, setActive] = useState<SocialPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/social-feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SocialFeedResponse | null) => {
        if (!cancelled && data?.posts?.length) setFeed(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section
      id="feed"
      eyebrow="Fresh from the Frog Queen"
      title="The feed"
      intro="Posts appear here once the owner connects Ivy's accounts. Until then these are reserved, owner-curated slots."
      tone="leaf"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Sticker tone="yellow">Live sync: not connected</Sticker>
        <Sticker tone="cream">Last synced: —</Sticker>
        <p className="text-sm text-charcoal/80">{feed.notice}</p>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {feed.posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => setActive(post)}
              className="w-full rounded-2xl bg-card p-3 text-left pop"
              aria-haspopup="dialog"
            >
              <MediaPlaceholder
                label={post.media[0]?.altText ?? "Reserved media slot"}
                aspect="square"
                tone="cream"
              />
              <p className="mt-3 line-clamp-2 text-sm text-card-foreground">{post.caption}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {post.platform === "manual" ? "Owner-curated" : post.platform} · {post.postedAt ?? "Date pending"}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg bg-cream">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Post details</DialogTitle>
            <DialogDescription className="text-charcoal/75">
              {active?.isFallback
                ? "This is a reserved slot. No live social data is connected."
                : "Synced from a connected account."}
            </DialogDescription>
          </DialogHeader>
          {active ? (
            <div className="space-y-4">
              <MediaPlaceholder label={active.media[0]?.altText ?? "Reserved media slot"} aspect="square" tone="leaf" />
              <p className="text-sm">{active.caption}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Likes</dt>
                  <dd>{active.likeCount ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Comments</dt>
                  <dd>{active.commentCount ?? "—"}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Section>
  );
}

/* ---------------- Ivy TV (consent-gated embeds + carousel) ---------------- */

const TV_SLOTS = [
  { id: "tv-1", title: "The Frog-Sit Compilation", note: "Clip slot awaiting owner upload" },
  { id: "tv-2", title: "Snack Negotiations, Round 12", note: "Clip slot awaiting owner upload" },
  { id: "tv-3", title: "Zoomies: Short Spine Edition", note: "Clip slot awaiting owner upload" },
  { id: "tv-4", title: "Sunbeam Patrol Documentary", note: "Clip slot awaiting owner upload" },
];

export function IvyTV() {
  const { consent, grant } = useEmbedConsent();
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = TV_SLOTS.length;

  const go = (next: number) => setIndex((next + total) % total);

  return (
    <Section
      id="ivy-tv"
      eyebrow="Ivy TV"
      title="Now showing: absolutely nothing important"
      intro="Video embeds stay off until you allow third-party content and the owner uploads approved clips."
      tone="ivy"
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Ivy TV clips"
        className="rounded-3xl bg-cream p-4 pop-static sm:p-6"
      >
        <div className="overflow-hidden rounded-2xl">
          <div
            ref={trackRef}
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {TV_SLOTS.map((slot, i) => (
              <div
                key={slot.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}: ${slot.title}`}
                aria-hidden={i !== index}
                className="w-full shrink-0 px-1"
              >
                {consent === "granted" ? (
                  <MediaPlaceholder
                    label={slot.title}
                    hint="Embeds allowed — waiting on an owner-approved video URL."
                    aspect="video"
                    tone="cream"
                  />
                ) : (
                  <div className="grid aspect-video w-full place-items-center rounded-xl bg-muted p-6 text-center ink-border">
                    <div>
                      <p className="font-display text-lg">Embed blocked</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Allow third-party embeds to load Ivy TV.
                      </p>
                      <button type="button" onClick={grant} className="mt-4 rounded-full bg-frog px-5 py-2 font-display text-sm pop">
                        Allow embeds
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-3 font-display text-lg text-charcoal">{slot.title}</p>
                <p className="text-sm text-charcoal/70">{slot.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <button type="button" onClick={() => go(index - 1)} className="rounded-full bg-card px-4 py-2 font-display text-sm pop" aria-label="Previous clip">
            ←
          </button>
          <ul className="flex items-center gap-2" role="tablist" aria-label="Choose clip">
            {TV_SLOTS.map((slot, i) => (
              <li key={slot.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to clip ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-4 w-4 rounded-full ink-border ${i === index ? "bg-frog" : "bg-card"}`}
                />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => go(index + 1)} className="rounded-full bg-card px-4 py-2 font-display text-sm pop" aria-label="Next clip">
            →
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Hall of Fame ---------------- */

export function HallOfFame() {
  const items = [
    { label: "Community fan art slot", caption: "Fan art — credit pending", rotate: -3, tone: "pink" as const },
    { label: "Meme submission slot", caption: "Meme of the month", rotate: 2, tone: "yellow" as const },
    { label: "Ivy cosplay slot", caption: "Cosplay division", rotate: -1, tone: "lavender" as const },
    { label: "Sticker design slot", caption: "Sticker pack draft", rotate: 3, tone: "leaf" as const },
    { label: "Community photo slot", caption: "Clubhouse meetup", rotate: -2, tone: "cream" as const },
    { label: "Doodle slot", caption: "Napkin doodle award", rotate: 1, tone: "pink" as const },
  ];
  return (
    <Section
      id="hall-of-fame"
      eyebrow="Hall of Fame"
      title="The scrapbook"
      intro="Community submissions live here once approved by Ivy's owner. Every entry keeps its original creator credit."
      tone="cream"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Polaroid key={item.label} label={item.label} caption={item.caption} rotate={item.rotate} tone={item.tone} />
        ))}
      </div>
    </Section>
  );
}

/* ---------------- The Lore ---------------- */

export function TheLore() {
  const beats = [
    { title: "A short spine enters the chat", body: "Ivy is born with a shorter spine and immediately decides it is a feature." },
    { title: "The frog-sit is discovered", body: "Back legs out, front paws forward. The internet loses its mind. Frog Queen is crowned." },
    { title: "The clubhouse forms", body: "Fans start swapping memes, doodles and captions faster than anyone can moderate." },
    { title: "$IVY appears", body: "A community coin as a membership card for the clubhouse. Details: Coming Soon." },
    { title: "What's next", body: "Whatever Ivy naps her way into. Announcements only when they're verified." },
  ];
  return (
    <Section id="lore" eyebrow="The Lore" title="How we got here" tone="leaf">
      <ol className="relative space-y-6 border-l-[3px] border-charcoal pl-6 sm:pl-8">
        {beats.map((beat, i) => (
          <li key={beat.title} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[2.15rem] grid h-8 w-8 place-items-center rounded-full bg-frog font-display text-sm pop-static sm:-left-[2.65rem]"
            >
              {i + 1}
            </span>
            <div className="rounded-2xl bg-card p-5 pop-static">
              <h3 className="text-xl">{beat.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{beat.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------------- Why $IVY ---------------- */

export function WhyIvy() {
  const reasons = [
    { emoji: "🫶", title: "Community first", body: "A place for people who like a dog and a decent joke. That's the whole pitch." },
    { emoji: "🧾", title: "No made-up numbers", body: "We publish nothing we can't verify. Unconfirmed fields say Coming Soon." },
    { emoji: "🐾", title: "Owner-approved media", body: "Only Ivy's family supplies her photos and clips. No stock dogs, ever." },
    { emoji: "🎨", title: "Meme-powered", body: "Make things, share things, credit people. The Meme Machine does the rest." },
  ];
  return (
    <Section
      id="why-ivy"
      eyebrow={`Why ${projectConfig.token.ticker}`}
      title="Reasons that aren't a price chart"
      intro={`${projectConfig.token.ticker} is a meme coin with no intrinsic value and no expectation of financial return.`}
      tone="cream"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {reasons.map((r) => (
          <article key={r.title} className="rounded-2xl bg-card p-6 pop-static">
            <span aria-hidden="true" className="text-3xl">
              {r.emoji}
            </span>
            <h3 className="mt-3 text-xl">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Token record ---------------- */

export function TokenRecord() {
  const t = projectConfig.token;
  const rows: Array<[string, string | null]> = [
    ["Token name", t.name],
    ["Ticker", t.ticker],
    ["Blockchain", t.blockchain],
    ["Contract address", t.contractAddress],
    ["Total supply", t.totalSupply],
    ["Buy / sell tax", t.taxes],
    ["Liquidity", t.liquidity],
    ["Launch date", t.launchDate],
    ["Block explorer", t.explorerUrl],
    ["Audit status", t.auditStatus],
    ["Exchange listings", t.exchanges.length ? t.exchanges.join(", ") : null],
    ["Partnerships", t.partnerships.length ? t.partnerships.join(", ") : null],
  ];

  return (
    <Section
      id="token-record"
      eyebrow="Token record"
      title="Everything we can actually confirm"
      intro="This table is the single source of truth. If a field says Coming Soon, it is not confirmed — treat any other source claiming otherwise as unofficial."
      tone="ivy"
    >
      <div className="overflow-hidden rounded-3xl bg-cream pop-static">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Verified {projectConfig.token.ticker} token details</caption>
          <thead className="bg-frog">
            <tr>
              <th scope="col" className="px-4 py-3 font-display text-charcoal sm:px-6">
                Field
              </th>
              <th scope="col" className="px-4 py-3 font-display text-charcoal sm:px-6">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-t-2 border-charcoal/15">
                <th scope="row" className="px-4 py-3 font-semibold text-charcoal sm:px-6">
                  {label}
                </th>
                <td className="px-4 py-3 text-charcoal sm:px-6">
                  {isConfigured(value) ? (
                    <span className="break-all">{displayValue(value)}</span>
                  ) : (
                    <ComingSoon />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-cream/80">
        No purchase links are shown because no contract address or exchange has been verified.
      </p>
    </Section>
  );
}
