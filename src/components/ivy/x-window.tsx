import {
  ExternalLinkIcon,
  ImageIcon,
  MessageCircleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { Sticker } from "./primitives";
import { FrogDoodle, PawDoodle } from "./doodles";
import { projectConfig, isSet } from "@/config/project";
import ivyAvatar from "@/assets/ivy-avatar-instagram.png.asset.json";

const X_HANDLE = "Ivyvibing";
const X_PROFILE_URL = isSet(projectConfig.socials.x)
  ? projectConfig.socials.x
  : `https://x.com/${X_HANDLE}`;
const X_COMMUNITY_URL = projectConfig.socials.community;

/**
 * X blocks third-party timeline embeds for this account (the syndication
 * endpoint answers "rate limit exceeded"), so instead of a dead frame this
 * window is a working control panel: Ivy's real avatar plus one-tap jumps to
 * her live posts, replies, media and community on x.com.
 */
const LINKS: Array<{
  key: string;
  label: string;
  hint: string;
  href: string;
  tone: string;
  Icon: typeof SparklesIcon;
}> = [
  {
    key: "posts",
    label: "Latest posts",
    hint: "Her live timeline, newest first",
    href: `${X_PROFILE_URL}`,
    tone: "bg-frog",
    Icon: SparklesIcon,
  },
  {
    key: "media",
    label: "Photos & videos",
    hint: "Every clip and photo she has posted",
    href: `https://x.com/${X_HANDLE}/media`,
    tone: "bg-yellow",
    Icon: ImageIcon,
  },
  {
    key: "replies",
    label: "Posts & replies",
    hint: "Ivy chatting back to the pond",
    href: `https://x.com/${X_HANDLE}/with_replies`,
    tone: "bg-pink",
    Icon: MessageCircleIcon,
  },
];

export function XWindow() {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] bg-card ink-border pop-static">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b-2 border-charcoal/15 bg-yellow px-4 py-3">
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
          <span className="h-3 w-3 rounded-full bg-charcoal/25" />
        </span>
        <a
          href={X_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2 rounded-full bg-charcoal/10 px-3 py-1"
        >
          <FrogDoodle aria-hidden className="h-3.5 w-4 shrink-0 text-ivy" />
          <span className="truncate text-xs text-charcoal/80">x.com/{X_HANDLE}</span>
        </a>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="relative flex shrink-0">
            <img
              src={ivyAvatar.url}
              alt="Ivy, the frog queen, smiling at the camera"
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 rounded-full bg-leaf object-cover ink-border sm:h-24 sm:w-24"
            />
            <span
              aria-hidden
              className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-frog ink-border"
            >
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
              Frog Queen of the internet. Short spine syndrome, long list of adventures.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map(({ key, label, hint, href, tone, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`pop flex min-h-24 flex-col justify-between rounded-2xl p-4 text-charcoal ink-border ${tone}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-lg leading-tight">{label}</span>
                <Icon aria-hidden className="h-5 w-5 shrink-0" />
              </span>
              <span className="text-sm text-charcoal/75">{hint}</span>
            </a>
          ))}
          {isSet(X_COMMUNITY_URL) ? (
            <a
              href={X_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pop flex min-h-24 flex-col justify-between rounded-2xl bg-lavender p-4 text-charcoal ink-border"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-lg leading-tight">X Community</span>
                <UsersIcon aria-hidden className="h-5 w-5 shrink-0" />
              </span>
              <span className="text-sm text-charcoal/75">Hop into the $ivy conversation</span>
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
          X blocks embedded timelines for third-party sites, so posts open on x.com where they stay
          live and complete.
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
