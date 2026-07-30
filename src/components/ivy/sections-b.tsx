import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Section, MediaPlaceholder, InfoCard, Sticker, StatusChip } from "./primitives";
import { CrownDoodle, FrogDoodle, IvyWordmark, PawDoodle, VineDivider } from "./doodles";
import { useEmbedConsent } from "./cookie-consent";
import {
  faqEntries,
  footerDisclaimer,
  memeMachine,
  navLinks,
  ownersCorner,
  royalCourt,
} from "@/data/site-content";
import { legalPages } from "@/data/legal";
import { COMING_SOON, projectConfig } from "@/config/project";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------- Meme Machine */

const MEME_PHOTOS = [
  "Approved meme photo 1",
  "Approved meme photo 2",
  "Approved meme photo 3",
  "Approved meme photo 4",
  "Approved meme photo 5",
  "Approved meme photo 6",
];

export function MemeMachine() {
  const [photo, setPhoto] = useState(0);
  const [topCaption, setTopCaption] = useState(memeMachine.captions[0]);
  const [bottomCaption, setBottomCaption] = useState(memeMachine.captions[1]);

  const captions = useMemo(() => memeMachine.captions, []);

  return (
    <Section
      id="meme-machine"
      eyebrow="Make something silly"
      title={memeMachine.heading}
      intro={memeMachine.body}
      tone="cream"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl bg-card p-4 pop-static">
          <div className="relative">
            <MediaPlaceholder
              label={MEME_PHOTOS[photo]}
              aspect="square"
              tone="leaf"
              hint={memeMachine.emptyState}
            />
            <p className="pointer-events-none absolute inset-x-3 top-3 text-center font-display text-lg text-cream uppercase drop-shadow-[2px_2px_0_#151515] sm:text-2xl">
              {topCaption}
            </p>
            <p className="pointer-events-none absolute inset-x-3 bottom-3 text-center font-display text-lg text-cream uppercase drop-shadow-[2px_2px_0_#151515] sm:text-2xl">
              {bottomCaption}
            </p>
          </div>
          <p className="mt-3 text-xs text-charcoal/70">{memeMachine.note}</p>
        </div>

        <div className="space-y-6">
          <fieldset>
            <legend className="font-display text-base text-charcoal">1. Choose an Ivy photo</legend>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {MEME_PHOTOS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPhoto(index)}
                  aria-pressed={photo === index}
                  className={cn(
                    "rounded-xl p-1.5 pop-static transition-colors",
                    photo === index ? "bg-frog" : "bg-card hover:bg-leaf",
                  )}
                >
                  <MediaPlaceholder label={`Photo ${index + 1}`} aspect="square" tone="leaf" compact />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {(
            [
              { legend: "2. Top caption", value: topCaption, set: setTopCaption },
              { legend: "3. Bottom caption", value: bottomCaption, set: setBottomCaption },
            ] as const
          ).map((group) => (
            <fieldset key={group.legend}>
              <legend className="font-display text-base text-charcoal">{group.legend}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {captions.map((caption) => (
                  <button
                    key={caption}
                    type="button"
                    onClick={() => group.set(caption)}
                    aria-pressed={group.value === caption}
                    className={cn(
                      "min-h-11 rounded-full px-3.5 font-display text-xs pop-static transition-colors",
                      group.value === caption ? "bg-pink text-charcoal" : "bg-card text-charcoal hover:bg-leaf",
                    )}
                  >
                    {caption}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset>
            <legend className="font-display text-base text-charcoal">4. Caption treatment</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(
                [
                  { label: "Caption position", options: ["Top", "Bottom", "Both"] },
                  { label: "Caption size", options: ["Small", "Medium", "Large"] },
                  { label: "Treatment", options: ["Light", "Dark"] },
                ] as const
              ).map((control) => (
                <div key={control.label}>
                  <p className="font-display text-xs text-charcoal/80">{control.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {control.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled
                        aria-disabled="true"
                        title="Unlocks when approved Ivy photos are supplied"
                        className="min-h-11 rounded-full bg-card px-3 font-display text-xs text-charcoal pop-static disabled:opacity-70"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-display text-base text-charcoal">5. Export</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Download meme", "Copy image", "Copy social caption"].map((action) => (
                <Button
                  key={action}
                  disabled
                  aria-disabled="true"
                  title="Export unlocks when approved Ivy photos are supplied"
                  className="min-h-11 rounded-full bg-card px-4 font-display text-sm text-charcoal pop-static hover:bg-card disabled:opacity-70"
                >
                  {action} — {COMING_SOON}
                </Button>
              ))}
            </div>
          </fieldset>

          <p className="rounded-xl bg-yellow p-4 text-sm text-charcoal pop-static">
            Downloading and sharing open once Ivy's family supplies the approved photo set. No
            uploads and no free-text captions — ever.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------- Owner's Corner */

export function OwnersCorner() {
  return (
    <Section
      id="owners-corner"
      eyebrow="Owner's Corner"
      title={ownersCorner.heading}
      intro={ownersCorner.body}
      tone="lavender"
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <MediaPlaceholder
          label={ownersCorner.mediaLabel}
          aspect="portrait"
          tone="cream"
          hint="Shared only with the owner's permission"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {ownersCorner.cards.map((card) => (
            <InfoCard key={card.title} title={card.title} body={card.body} tone="cream" />
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ Royal Court */

export function RoyalCourt() {
  const { openSettings } = useEmbedConsent();

  return (
    <Section
      id="royal-court"
      eyebrow="Official channels"
      title={royalCourt.heading}
      intro={royalCourt.body}
      tone="white"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {royalCourt.channels.map((channel) => {
          const url =
            channel.id === "email"
              ? projectConfig.contactEmail
              : (projectConfig.socials as unknown as Record<string, string | null>)[channel.id] ?? null;
          return (
            <li key={channel.id} className="rounded-2xl bg-cream p-5 pop-static">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg text-charcoal">{channel.label}</h3>
                <StatusChip status={url ? "ok" : "pending"} label={url ? "Official" : COMING_SOON} />
              </div>
              <p className="mt-2 text-sm text-charcoal/80">
                {url ?? "No official channel has been published yet."}
              </p>
              <Button
                disabled={!url}
                aria-disabled={!url}
                asChild={false}
                className="mt-4 min-h-11 w-full rounded-full bg-card px-4 font-display text-sm text-charcoal pop-static hover:bg-card disabled:opacity-70"
              >
                {url ? "Visit official channel" : `${channel.label} — ${COMING_SOON}`}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <p className="rounded-xl bg-pink p-4 font-display text-sm text-charcoal pop-static">
          {royalCourt.safety}
        </p>
        <p className="rounded-xl bg-yellow p-4 text-sm text-charcoal pop-static">
          {royalCourt.gallery}
        </p>
      </div>

      <Button
        onClick={openSettings}
        variant="secondary"
        className="mt-6 min-h-11 rounded-full bg-cream px-5 font-display text-charcoal pop hover:bg-cream"
      >
        Cookie settings
      </Button>
    </Section>
  );
}

/* -------------------------------------------------------------------- FAQ */

export function FAQ() {
  return (
    <Section
      id="faq"
      eyebrow="Questions"
      title="Frequently Asked Questions"
      intro="Straight answers, no hype. If something is not confirmed yet, we say so."
      tone="leaf"
    >
      <Accordion type="single" collapsible className="w-full space-y-3">
        {faqEntries.map((entry, index) => (
          <AccordionItem
            key={entry.question}
            value={`faq-${index}`}
            className="rounded-2xl border-0 bg-cream px-4 pop-static"
          >
            <AccordionTrigger className="py-4 text-left font-display text-base text-charcoal hover:no-underline sm:text-lg">
              {entry.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-charcoal/85">
              {entry.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

/* ----------------------------------------------------------------- Footer */

export function SiteFooter() {
  const { openSettings } = useEmbedConsent();

  return (
    <footer className="night text-cream">
      <VineDivider className="opacity-40" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <IvyWordmark />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80">{footerDisclaimer}</p>
          <div className="mt-4 flex gap-2" aria-hidden>
            <CrownDoodle className="h-5 w-8 text-yellow" />
            <FrogDoodle className="h-5 w-6 text-frog" />
            <PawDoodle className="h-5 w-5 text-pink" />
          </div>
        </div>

        <nav aria-label="Sections">
          <h2 className="font-display text-base text-cream">Explore</h2>
          <ul className="mt-3 space-y-1">
            {navLinks.map((link) => (
              <li key={link.hash}>
                <a
                  href={link.hash}
                  className="inline-flex min-h-9 items-center text-sm text-cream/80 underline-offset-4 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal and disclosures">
          <h2 className="font-display text-base text-cream">Legal</h2>
          <ul className="mt-3 space-y-1">
            {legalPages.map((page) => (
              <li key={page.slug}>
                <Link
                  to="/legal/$slug"
                  params={{ slug: page.slug }}
                  className="inline-flex min-h-9 items-center text-sm text-cream/80 underline-offset-4 hover:underline"
                >
                  {page.title}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex min-h-9 items-center text-sm text-cream/80 underline-offset-4 hover:underline"
              >
                Cookie settings
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-cream/70 sm:px-6">
          <p>
            © {new Date().getFullYear()} {projectConfig.projectName}. Not financial advice.
          </p>
          <Sticker tone="frog">Short Spine. Big Vibes.</Sticker>
        </div>
      </div>
    </footer>
  );
}
