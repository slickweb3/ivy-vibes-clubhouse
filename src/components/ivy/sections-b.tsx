import { Link } from "@tanstack/react-router";
import { scrollToSection } from "@/lib/scroll-to-section";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Section, InfoCard, Sticker, StatusChip } from "./primitives";
import { CrownDoodle, FrogDoodle, IvyWordmark, PawDoodle, VineDivider } from "./doodles";
import { useEmbedConsent } from "./cookie-consent";
import {
  faqEntries,
  footerDisclaimer,
  navLinks,
  ownerCorner,
  royalCourt,
} from "@/data/site-content";
import { legalPages } from "@/data/legal";
import { COMING_SOON, projectConfig } from "@/config/project";

/* --------------------------------------------------------- Owner's Corner */

export function OwnerCorner() {
  return (
    <Section
      id="owner-corner"
      eyebrow="Owner's Corner"
      title={ownerCorner.heading}
      intro={ownerCorner.body}
      tone="lavender"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ownerCorner.cards.map((card) => (
          <InfoCard key={card.title} title={card.title} body={card.body} tone="cream" />
        ))}
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
            (projectConfig.socials as unknown as Record<string, string | null>)[channel.id] ?? null;
          return (
            <li key={channel.id} data-tilt className="rounded-2xl bg-card p-5 pop-static">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg text-charcoal">{channel.label}</h3>
                <StatusChip
                  status={url ? "ok" : "pending"}
                  label={url ? "Official" : COMING_SOON}
                />
              </div>
              <p className="mt-2 break-all text-sm text-charcoal/80">
                {url ?? "No official channel has been published yet."}
              </p>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-card px-4 font-display text-sm text-charcoal pop-static"
                >
                  Visit official channel
                </a>
              ) : (
                <Button
                  disabled
                  aria-disabled
                  asChild={false}
                  className="mt-4 min-h-11 w-full rounded-full bg-card px-4 font-display text-sm text-charcoal pop-static hover:bg-card disabled:opacity-70"
                >
                  {`${channel.label} — ${COMING_SOON}`}
                </Button>
              )}
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
        className="mt-6 min-h-11 rounded-full bg-card px-5 font-display text-charcoal pop hover:bg-card"
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
            className="rounded-2xl border-0 bg-card px-4 pop-static"
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
    <footer id="site-footer" className="night text-cream">
      <VineDivider className="opacity-40" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <IvyWordmark tone="onDark" />
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
                  href={`/${link.hash}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                    if (scrollToSection(link.hash)) event.preventDefault();
                  }}
                  className="inline-flex min-h-11 items-center text-sm text-cream/80 underline-offset-4 hover:underline"
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
                  className="inline-flex min-h-11 items-center text-sm text-cream/80 underline-offset-4 hover:underline"
                >
                  {page.title}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex min-h-11 items-center text-sm text-cream/80 underline-offset-4 hover:underline"
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
