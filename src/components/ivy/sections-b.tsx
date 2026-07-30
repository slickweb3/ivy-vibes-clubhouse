import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, MediaPlaceholder, Sticker, ComingSoon } from "./primitives";
import { projectConfig, isConfigured } from "@/config/project";

/* ---------------- Ivy Meme Machine ---------------- */

const TEMPLATES = [
  { id: "frog", label: "Frog-sit throne" },
  { id: "polaroid", label: "Polaroid stack" },
  { id: "crown", label: "Crowned portrait" },
];

export function MemeMachine() {
  const [top, setTop] = useState("SHORT SPINE");
  const [bottom, setBottom] = useState("BIG VIBES");
  const [template, setTemplate] = useState(TEMPLATES[0].id);

  const templateLabel = useMemo(
    () => TEMPLATES.find((t) => t.id === template)?.label ?? "",
    [template],
  );

  return (
    <Section
      id="meme-machine"
      eyebrow="Ivy Meme Machine"
      title="Caption it yourself"
      intro="Preview a caption on a template. Downloads and uploads switch on once the owner supplies approved base images."
      tone="leaf"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form className="rounded-3xl bg-card p-6 pop-static" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="font-display text-lg">Build your meme</legend>

            <div>
              <label htmlFor="meme-template" className="block font-display text-sm">
                Template
              </label>
              <select
                id="meme-template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="mt-2 w-full rounded-xl bg-cream px-3 py-2.5 text-sm ink-border"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="meme-top" className="block font-display text-sm">
                Top text
              </label>
              <input
                id="meme-top"
                value={top}
                maxLength={40}
                onChange={(e) => setTop(e.target.value)}
                className="mt-2 w-full rounded-xl bg-cream px-3 py-2.5 text-sm ink-border"
              />
            </div>

            <div>
              <label htmlFor="meme-bottom" className="block font-display text-sm">
                Bottom text
              </label>
              <input
                id="meme-bottom"
                value={bottom}
                maxLength={40}
                onChange={(e) => setBottom(e.target.value)}
                className="mt-2 w-full rounded-xl bg-cream px-3 py-2.5 text-sm ink-border"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={!projectConfig.features.memeMachineUploadsEnabled}
                className="rounded-full bg-frog px-5 py-2.5 font-display text-sm text-charcoal pop disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                Download meme
              </button>
              <ComingSoon />
            </div>
            <p className="text-xs text-muted-foreground">
              Submissions open when the owner enables uploads. Approved memes appear in the Hall of Fame with credit.
            </p>
          </fieldset>
        </form>

        <div className="rounded-3xl bg-card p-6 pop-static">
          <p className="font-display text-sm text-muted-foreground">Preview — {templateLabel}</p>
          <div className="relative mt-3">
            <MediaPlaceholder label="Owner-approved meme base image" aspect="square" tone="cream" />
            <p
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-6 text-center font-display text-2xl break-words text-charcoal uppercase sm:text-3xl"
            >
              {top}
            </p>
            <p
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 bottom-6 text-center font-display text-2xl break-words text-charcoal uppercase sm:text-3xl"
            >
              {bottom}
            </p>
          </div>
          <p className="sr-only">
            Meme preview with top text {top} and bottom text {bottom}.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Owner's Corner ---------------- */

export function OwnersCorner() {
  return (
    <Section
      id="owners-corner"
      eyebrow="Owner's Corner"
      title="A note from Ivy's family"
      intro="Ivy's owner controls every photo, clip and claim about her. This section is theirs."
      tone="cream"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <MediaPlaceholder
          label="Owner-supplied portrait or family photo"
          hint="Uploaded from the admin dashboard"
          aspect="portrait"
          tone="pink"
        />
        <div className="rounded-3xl bg-card p-6 pop-static sm:p-8">
          <blockquote className="text-lg leading-relaxed">
            “This space is reserved for a statement from Ivy&apos;s owner. Nothing is published here on their
            behalf. Until they write it, the slot stays empty on purpose.”
          </blockquote>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-display text-sm text-muted-foreground">Media approvals</dt>
              <dd className="mt-1 text-sm">Owner-only, via the admin dashboard</dd>
            </div>
            <div>
              <dt className="font-display text-sm text-muted-foreground">Contact</dt>
              <dd className="mt-1 text-sm">
                {isConfigured(projectConfig.ownerContactEmail) ? projectConfig.ownerContactEmail : <ComingSoon />}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- The Royal Court ---------------- */

export function RoyalCourt() {
  const roles = [
    { emoji: "👑", title: "The Queen", body: "Ivy. Non-negotiable. Sets the tone, sets the naps." },
    { emoji: "🐸", title: "Frog Envoys", body: "Community members who keep the frog-sit lore alive." },
    { emoji: "🎨", title: "Court Artists", body: "Meme makers and doodlers filling the Hall of Fame." },
    { emoji: "🛡️", title: "Moderators", body: "Volunteers keeping the clubhouse warm and scam-free." },
    { emoji: "📣", title: "Town Criers", body: "Share only verified announcements from this site." },
    { emoji: "🐾", title: "Everyone Else", body: "You. Membership costs one (1) good joke." },
  ];
  return (
    <Section
      id="royal-court"
      eyebrow="The Royal Court"
      title="Who's who in the clubhouse"
      intro="Roles are community titles, not staff positions. No individual names are published without consent."
      tone="ivy"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <article key={r.title} className="rounded-2xl bg-cream p-6 pop-static">
            <span aria-hidden="true" className="text-3xl">
              {r.emoji}
            </span>
            <h3 className="mt-3 text-xl text-charcoal">{r.title}</h3>
            <p className="mt-2 text-sm text-charcoal/75">{r.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- FAQ ---------------- */

const FAQS = [
  {
    q: "Is Ivy a real dog?",
    a: "Yes. Ivy is a real dog with a short spine, known online as the Short Spine Queen and Frog Queen. Every photo and clip on this site comes from her owner.",
  },
  {
    q: "What is $IVY?",
    a: "$IVY is a community meme coin inspired by Ivy. It is a cultural project, not a company, product, security or investment scheme.",
  },
  {
    q: "Where is the contract address?",
    a: "Not published. No contract address, blockchain or launch date has been verified, so those fields show Coming Soon. Anyone giving you an address elsewhere is not speaking for this site.",
  },
  {
    q: "Can I buy $IVY right now?",
    a: "This site lists no exchanges or purchase links because none are confirmed. Be extremely careful with any third party claiming to sell it.",
  },
  {
    q: "Why does the social feed look empty?",
    a: "No social account is connected yet. The feed serves owner-curated fallback entries from a local cache and never fetches from social platforms at page load.",
  },
  {
    q: "How do I submit fan art or memes?",
    a: "Submissions open once the owner enables uploads in the admin dashboard. Approved entries appear in the Hall of Fame with creator credit.",
  },
  {
    q: "Does this site track me?",
    a: "Third-party embeds are blocked until you explicitly allow them. You can change your choice at any time by clearing site data.",
  },
];

export function FAQ() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Questions, answered plainly" tone="cream">
      <Accordion type="single" collapsible className="w-full space-y-3">
        {FAQS.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`} className="rounded-2xl bg-card px-5 pop-static">
            <AccordionTrigger className="text-left font-display text-base hover:no-underline sm:text-lg">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

/* ---------------- Footer ---------------- */

export function SiteFooter() {
  return (
    <footer className="night border-t-[3px] border-charcoal py-14 text-cream">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-frog text-lg pop-static">🐸</span>
              <span className="font-display text-xl">{projectConfig.siteName}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-cream/80">{projectConfig.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Sticker tone="yellow">Not financial advice</Sticker>
              <Sticker tone="pink">Community project</Sticker>
            </div>
          </div>

          <nav aria-label="Social">
            <h2 className="font-display text-lg">Socials</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {projectConfig.socials.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span>{s.label}</span>
                  {isConfigured(s.url) ? (
                    <a href={s.url!} rel="noreferrer noopener" target="_blank" className="underline">
                      {s.handle ?? "Visit"}
                    </a>
                  ) : (
                    <ComingSoon />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal and disclosures">
            <h2 className="font-display text-lg">Legal</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a className="underline" href="/legal/terms">
                  Terms of Use
                </a>
              </li>
              <li>
                <a className="underline" href="/legal/privacy">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="underline" href="/legal/disclaimer">
                  Risk Disclaimer
                </a>
              </li>
              <li>
                <a className="underline" href="/legal/cookies">
                  Cookies &amp; Embeds
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 space-y-3 rounded-2xl bg-cream/10 p-5 text-xs leading-relaxed text-cream/85">
          <p>
            <strong>Disclosure.</strong> {projectConfig.token.ticker} is a meme coin created for entertainment
            and community purposes. It has no intrinsic value, no utility promise, no roadmap guarantee and no
            expectation of financial return. Nothing on this site is financial, investment, legal or tax advice.
          </p>
          <p>
            <strong>Unverified details.</strong> Token, contract, blockchain, launch, exchange, partnership and
            audit information is shown as “Coming Soon” until officially confirmed. Treat any other source as
            unofficial and potentially fraudulent.
          </p>
          <p>
            <strong>Media.</strong> All imagery of Ivy is supplied and approved by her owner. Placeholders mark
            slots reserved for that media. No stock or generated substitutes for Ivy are used anywhere on this site.
          </p>
          <p>© {new Date().getFullYear()} {projectConfig.siteName}. An unofficial community clubhouse made with fondness.</p>
        </div>
      </div>
    </footer>
  );
}
