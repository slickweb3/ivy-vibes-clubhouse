import { ExternalLinkIcon, UsersIcon } from "lucide-react";
import { Sticker } from "./primitives";
import { FrogDoodle, PawDoodle } from "./doodles";
import { projectConfig, isSet } from "@/config/project";

const X_HANDLE = "Ivyvibing";
const X_PROFILE_URL = isSet(projectConfig.socials.x)
  ? projectConfig.socials.x
  : `https://x.com/${X_HANDLE}`;
const X_COMMUNITY_URL = projectConfig.socials.community;

/** X rate-limits public timeline embeds, so this window links to canonical X pages instead. */
export function XWindow() {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] bg-card ink-border pop-static">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b-2 border-charcoal/15 bg-yellow px-4 py-3">
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
        </span>
        <span className="flex min-w-0 items-center gap-2 rounded-full bg-charcoal/10 px-3 py-1">
          <FrogDoodle aria-hidden className="h-3.5 w-4 shrink-0 text-ivy" />
          <span className="truncate text-xs text-charcoal/80">x.com/{X_HANDLE}</span>
        </span>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span
            aria-hidden
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-charcoal ink-border sm:h-24 sm:w-24"
          >
            <span className="font-display text-4xl text-cream">X</span>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-frog ink-border">
              <PawDoodle className="h-3.5 w-3.5 text-charcoal" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl leading-tight text-charcoal">Ivy</p>
            <a
              href={X_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 max-w-full items-center truncate text-sm text-ivy underline underline-offset-4"
            >
              @{X_HANDLE}
            </a>
            <p className="mt-1 text-sm text-charcoal/80">
              The Frog Queen&apos;s official X profile.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={X_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pop flex min-h-28 flex-col justify-between rounded-2xl bg-frog p-4 text-charcoal ink-border"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-display text-xl">Official profile</span>
              <ExternalLinkIcon aria-hidden className="h-5 w-5 shrink-0" />
            </span>
            <span className="text-sm text-charcoal/75">
              See Ivy&apos;s newest posts directly on X
            </span>
          </a>
          {isSet(X_COMMUNITY_URL) ? (
            <a
              href={X_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pop flex min-h-28 flex-col justify-between rounded-2xl bg-lavender p-4 text-charcoal ink-border"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-xl">X Community</span>
                <UsersIcon aria-hidden className="h-5 w-5 shrink-0" />
              </span>
              <span className="text-sm text-charcoal/75">Hop into the community conversation</span>
            </a>
          ) : null}
        </div>
        <Sticker tone="leaf">
          <FrogDoodle className="h-3.5 w-4 text-ivy" />
          official links
        </Sticker>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-2 border-charcoal/15 bg-leaf/40 px-4 py-3 text-xs sm:px-6">
        <span className="max-w-md text-charcoal/70">
          Opens directly on X, avoiding the rate-limited embedded timeline.
        </span>
        <a
          href={X_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="pop inline-flex min-h-11 items-center gap-1 rounded-full bg-frog px-3 font-display text-charcoal"
        >
          Open profile
          <ExternalLinkIcon aria-hidden className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
