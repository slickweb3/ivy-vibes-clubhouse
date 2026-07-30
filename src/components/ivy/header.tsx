import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { announcement, joinTheVibeMessage, navLinks } from "@/data/site-content";
import { CrownDoodle, FrogDoodle, IvyWordmark, PawDoodle } from "./doodles";
import { cn } from "@/lib/utils";

function AnnouncementBar() {
  return (
    <div className="bg-ivy text-cream" role="region" aria-label="Announcement">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center">
        <CrownDoodle className="hidden h-4 w-6 shrink-0 text-yellow wiggle sm:block" />
        <PawDoodle className="hidden h-4 w-4 shrink-0 text-frog float-slow sm:block" />
        <p className="text-xs leading-snug font-semibold sm:text-sm">{announcement}</p>
        <FrogDoodle className="hidden h-4 w-5 shrink-0 text-frog wiggle sm:block" />
      </div>
    </div>
  );
}

function JoinTheVibeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const links = officialLinks();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-card pop-static">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-charcoal">
            <CrownDoodle className="h-5 w-8 text-frog" />
            Join the Vibe
          </DialogTitle>
          <DialogDescription className="text-base text-charcoal/85">
            {joinTheVibeMessage}
          </DialogDescription>
        </DialogHeader>
        {links.length > 0 ? (
          <ul className="grid gap-2">
            {links.map(({ key, url }) => (
              <li key={key}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border-[3px] border-charcoal bg-leaf px-3 py-2 text-sm font-bold text-charcoal pop-static transition-transform hover:-translate-y-0.5"
                >
                  <span>{socialLabels[key] ?? key}</span>
                  <span className="truncate text-xs font-medium text-charcoal/70">
                    {url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="rounded-xl bg-yellow p-3 text-sm text-charcoal pop-static">
          These are the only official IvyVibing channels. Anything else claiming to be us is not us.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function SiteNav({ isHome = true }: { isHome?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const href = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b-[3px] border-charcoal bg-card/95 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="shrink-0" aria-label="IvyVibing home">
            <IvyWordmark />
          </Link>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <li key={link.hash}>
                <a
                  href={href(link.hash)}
                  className="inline-flex min-h-11 items-center rounded-full px-3 font-display text-sm text-charcoal transition-colors hover:bg-leaf"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => setJoinOpen(true)}
            className="ml-auto min-h-11 rounded-full bg-pink px-4 font-display text-charcoal pop hover:bg-pink lg:ml-2"
          >
            Join the Vibe
          </Button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-leaf text-charcoal pop lg:hidden"
          >
            {mobileOpen ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </nav>

        <div
          id="mobile-menu"
          hidden={!mobileOpen}
          className={cn("border-t-[3px] border-charcoal bg-card lg:hidden")}
        >
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {navLinks.map((link) => (
              <li key={link.hash}>
                <a
                  href={href(link.hash)}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center gap-2 border-b border-charcoal/15 font-display text-base text-charcoal"
                >
                  <PawDoodle className="h-4 w-4 text-frog" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <JoinTheVibeDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
