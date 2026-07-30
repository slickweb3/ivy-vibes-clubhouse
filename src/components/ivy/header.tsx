import { useEffect, useState } from "react";
import { Sticker } from "./primitives";
import { projectConfig } from "@/config/project";

const NAV_ITEMS = [
  { href: "#meet-ivy", label: "Meet Ivy" },
  { href: "#feed", label: "Feed" },
  { href: "#ivy-tv", label: "Ivy TV" },
  { href: "#lore", label: "Lore" },
  { href: "#why-ivy", label: "Why $IVY" },
  { href: "#token-record", label: "Token" },
  { href: "#faq", label: "FAQ" },
];

export function AnnouncementBar() {
  const items = [
    "$IVY is a community meme coin — not an investment",
    "Short spine. Big vibes.",
    "Token details: Coming Soon",
    "Frog Queen approved",
    "No price talk, only paw talk",
  ];
  return (
    <div className="overflow-hidden border-b-[3px] border-charcoal bg-pink py-2" role="region" aria-label="Announcements">
      <div className="marquee-track whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={dup === 1}>
            {items.map((item) => (
              <span key={item} className="font-display text-xs tracking-wide text-charcoal uppercase sm:text-sm">
                🐸 {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <nav
        aria-label="Main"
        className={`border-b-[3px] border-charcoal bg-cream/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-[0_6px_0_0_rgba(21,21,21,0.12)]" : ""
        }`}
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-frog font-display text-lg pop-static">
              🐸
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg leading-none sm:text-xl">
                {projectConfig.siteName}
              </span>
              <span className="block truncate text-[0.7rem] text-muted-foreground">
                Home of {projectConfig.token.ticker}
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <ul className="hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="rounded-full px-3 py-2 font-display text-sm text-charcoal transition-colors hover:bg-leaf"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#token-record"
              className="hidden rounded-full bg-frog px-4 py-2 font-display text-sm text-charcoal pop sm:inline-flex"
            >
              Get $IVY
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lavender pop lg:hidden"
            >
              <span aria-hidden="true" className="font-display text-lg">
                {open ? "✕" : "☰"}
              </span>
            </button>
          </div>
        </div>

        {open ? (
          <div id="mobile-nav" className="border-t-[3px] border-charcoal bg-cream lg:hidden">
            <ul className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2 sm:px-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 font-display text-base hover:bg-leaf"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="py-3">
                <a
                  href="#token-record"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-frog px-4 py-3 text-center font-display pop"
                >
                  Get $IVY
                </a>
              </li>
            </ul>
          </div>
        ) : null}
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section id="top" className="meadow relative overflow-hidden border-b-[3px] border-charcoal">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Sticker tone="pink">👑 Short Spine Queen</Sticker>
            <Sticker tone="lavender">🐸 Frog Queen</Sticker>
          </div>
          <h1 className="mt-5 text-[2.6rem] leading-[0.95] sm:text-6xl lg:text-7xl">
            SHORT SPINE.
            <br />
            <span className="text-ivy">BIG VIBES.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg">
            Welcome to Ivy&apos;s clubhouse — a warm, slightly chaotic corner of the internet built by
            people who love a short-spine dog with a very long personality. {projectConfig.token.ticker} is
            the community coin that lives here.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#meet-ivy" className="rounded-full bg-frog px-6 py-3 font-display text-charcoal pop">
              Meet Ivy
            </a>
            <a href="#token-record" className="rounded-full bg-cream px-6 py-3 font-display text-charcoal pop">
              Token Record
            </a>
          </div>
          <p className="mt-5 text-sm text-charcoal/70">
            Contract, chain and launch details are unverified and shown as “Coming Soon”. Nothing here is
            financial advice.
          </p>
        </div>

        <div className="relative min-w-0">
          <div className="float-slow">
            <div className="polaroid mx-auto max-w-sm">
              <div className="rounded-lg">
                <div className="aspect-[4/5] w-full">
                  <div className="grid h-full w-full place-items-center rounded-lg bg-leaf p-6 text-center ink-border">
                    <div>
                      <span className="rounded-full bg-charcoal px-3 py-1 font-display text-[0.65rem] tracking-widest text-cream uppercase">
                        Owner media slot
                      </span>
                      <p className="mt-3 font-display text-lg">Hero portrait of Ivy</p>
                      <p className="mt-1 text-xs text-charcoal/70">
                        Owner-approved photo only. No stock dogs, no generated lookalikes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <figcaption className="mt-3 text-center font-display text-sm">
                Her Royal Shortness, in residence
              </figcaption>
            </div>
          </div>
          <span aria-hidden="true" className="wiggle absolute -top-2 -left-1 text-4xl">
            🐾
          </span>
          <span aria-hidden="true" className="wiggle absolute -right-1 bottom-6 text-4xl">
            🐸
          </span>
        </div>
      </div>
    </section>
  );
}
