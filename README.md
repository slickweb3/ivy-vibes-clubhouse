# ivy vibing — $ivy

The official clubhouse for **$ivy**, the community meme coin inspired by **Ivy**, the
Short Spine Queen and Frog Queen. Ivy comes first; crypto comes second.

Built with TanStack Start (React 19 + Vite 7), Tailwind CSS v4 and Lovable Cloud
(PostgreSQL + auth).

---

## Honesty rules baked into the code

These are enforced by the code, not just by convention:

1. **No invented facts.** Blockchain, contract address, supply, launch date,
   tokenomics, price, exchanges, partnerships and audits live in
   `src/config/project.ts` and are all `null`. Any `null` field renders a
   **Coming Soon** pill. Never hardcode a value into a component.
2. **No stock dogs and no AI-generated Ivy.** Every image slot is a clearly
   labelled `MediaPlaceholder` reading "Owner media slot". Replace them only
   with media Ivy's owner has approved.
3. **No pretend connections.** Instagram and TikTok are shown as _Not
   connected_ until real credentials exist. The site never scrapes.
4. **No invented social links.** The Royal Court lists channels with
   _Coming Soon_ until a URL is added to `projectConfig.socials`.
5. **Legal pages are drafts.** Each one is labelled as requiring professional
   review.

---

## Getting started

```bash
npm install
npm run dev     # http://localhost:8080
```

Backend environment variables are injected automatically by Lovable Cloud
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and their server-side
`SUPABASE_*` counterparts).

---

## Project structure

```
src/
  config/project.ts          single source of truth for token + social facts
  data/site-content.ts       editable public copy (mirrors content tables)
  data/legal.ts              seven draft legal pages
  types/social.ts            normalized SocialPost / MediaItem contract
  components/ivy/
    doodles.tsx              original SVG crowns, paws, frogs, vines, grass
    primitives.tsx           MediaPlaceholder, Polaroid, Section, StatusChip…
    cookie-consent.tsx       consent provider + settings dialog
    header.tsx               announcement bar, sticky nav, Join the Vibe
    sections.tsx             Hero, Meet Ivy, Fresh Posts, Ivy TV, Hall of Fame,
                             The Lore, Why $ivy, Token Record
    sections-b.tsx           Meme Machine, Owner's Corner, Royal Court, FAQ, Footer
  lib/
    social-feed.server.ts    reads ONLY the local cache table
    social-sync.server.ts    12-hour sync algorithm + guarded stub
    social-oauth.server.ts   credential guards, sanitized errors
    admin.functions.ts       protected server functions (role-checked)
  routes/
    index.tsx                homepage
    legal.$slug.tsx          /legal/terms, /legal/privacy, …
    auth.tsx                 team sign in
    _authenticated/          route gate + /admin dashboard
    api/social-feed.ts               public GET, cache-only
    api/public/oauth/$provider.$action.ts   OAuth stubs
    api/public/hooks/social-sync.ts         scheduled sync hook
```

---

## Database

The schema lives in Lovable Cloud and covers: `profiles`, `user_roles`,
`project_config`, `content_blocks`, `media_items`, `social_posts`,
`social_connections`, `sync_runs`, `admin_audit_logs`, `faq_entries`,
`timeline_chapters`, `ivy_tv_items`, `gallery_items`, `meme_captions` and
`legal_pages`.

Row-Level Security is on for every table. Public visitors can read only
approved, visible content. Writes require an `admin` or `editor` role stored in
`user_roles` — never on the profile row, to avoid privilege escalation.

### Granting the first admin

1. Sign up at `/auth`.
2. Insert a row into `user_roles` with your user id and the `admin` role.
3. Reload `/admin`; the dashboard unlocks.

---

## Social feed

**Read path (public).** `GET /api/social-feed` returns:

```json
{
  "instagram": [],
  "tiktok": [],
  "lastUpdated": null,
  "status": { "instagram": "not_configured", "tiktok": "not_configured" }
}
```

It reads only from the `social_posts` cache table. It never calls Instagram or
TikTok, and it never returns provider payloads or credentials.

**Write path (scheduled).** `POST /api/public/hooks/social-sync` with header
`x-sync-secret: $SOCIAL_SYNC_SECRET`, roughly every 12 hours. For each enabled,
credentialed platform it fetches the newest posts from the official API,
normalizes, dedupes on `(platform, platform_post_id)`, sorts by publish time and
upserts — **preserving administrator overrides**: `custom_caption`, `alt_text`,
`is_visible`, `is_pinned`, `is_featured`, `allow_autoplay`,
`fallback_thumbnail_url` and `approval_status`. Posts that disappear are marked
unavailable, never deleted. Failures are logged with sanitized messages and the
last good feed is retained, so the public page never goes blank.

### Connecting an account

Add these in **Project Settings → Secrets**, then complete the OAuth flow from
`/admin`:

| Platform  | Required secrets                                                           |
| --------- | -------------------------------------------------------------------------- |
| Instagram | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` |
| TikTok    | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`         |
| Sync hook | `SOCIAL_SYNC_SECRET`                                                       |

Until they exist, every OAuth endpoint returns an honest `503 not_configured`
listing the missing variables. Access tokens are never stored in application
tables — `social_connections` holds only an opaque `token_ref`.

---

## Replacing the media placeholders

1. Collect owner-approved photos and videos.
2. Upload them through **Admin → Media** (or add rows to `media_items`).
3. Give every item descriptive alt text — it is required, not optional.
4. Placeholders disappear automatically once a slot has real media.

Do not substitute stock photography, another dog, or a generated image.

---

## Accessibility and performance

- Single `<main>` per page, one `<h1>`, semantic landmarks and skip link.
- Keyboard-operable nav, tabs, accordion and dialogs (Radix primitives).
- 44px minimum tap targets; status is never conveyed by colour alone.
- All animation is subtle and respects `prefers-reduced-motion`.
- Third-party embeds are consent-gated and load only after an explicit play.

## SEO

Per-route `head()` metadata with unique titles, descriptions and Open Graph
tags. Admin and auth routes are `noindex`. Add `og:image` only once a real
brand image with an absolute URL exists.

---

## Disclaimer

$ivy is a community meme project. Digital assets are highly speculative and may
lose all value. Nothing in this repository or on the website is financial,
legal or tax advice. Instagram, TikTok and other platforms do not sponsor or
endorse this project.

## Final alignment pass notes

- Feed status values are exactly `connected | disconnected | expired | error`.
  With no provider credentials configured, both platforms report
  `disconnected` — the site never pretends a connection is live.
- `GET /api/social-feed` reads the local `social_posts` cache only and is served
  with `public, max-age=300, stale-while-revalidate=3600`.
- Legal aliases `/terms`, `/privacy`, `/cookies`, `/risk-disclosure`,
  `/media-usage`, `/community-guidelines` and `/accessibility` resolve to the
  canonical `/legal/<slug>` draft pages (each marked as requiring professional
  review before launch).
- `/admin/sign-in` is the polished, setup-required administrator entry point.
  There are no demo or hard-coded credentials anywhere in the codebase.
- SEO: title `$ivy — The Official ivy vibing Meme Coin`, matching meta
  description, self-referencing canonical, `public/robots.txt`,
  `/sitemap.xml` server route and an original crown/paw/leaf `favicon.svg`.
- Meme Machine exposes preset caption chips plus disabled architecture controls
  (image, caption position, size, light/dark treatment, export, copy social
  caption). No uploads and no free-text captions.

## Ivy Social Pipeline

Official accounts (the only accounts eligible for automatic publication):

- Instagram — [@frogqueenivy](https://www.instagram.com/frogqueenivy/)
- TikTok — [@ivyvibing](https://www.tiktok.com/@ivyvibing)
- Linktree — https://linktr.ee/ivyvibing

### Unified approved-media read model

`unified_media` (database view) + `media_placements` feed a single reader,
`src/lib/media-read.server.ts`. Hero, Fresh Posts, Ivy TV, Hall of Fame and the
Meme Machine all consume the same `SiteMedia` object, so an approved item
appears everywhere its placements say it should — never only in Fresh Posts.

Ivy's original caption is stored verbatim and used as the website copy. A
website-only caption override is optional and never overwrites the source.

### Placement defaults

| Media            | Placements                                                |
| ---------------- | --------------------------------------------------------- |
| video / reel     | Fresh Posts + Ivy TV                                      |
| image / carousel | Fresh Posts + Hall of Fame                                |
| Hero             | newest approved image, unless an owner-pinned hero exists |
| Meme Machine     | only items with community reuse enabled (off by default)  |

Manual pinned/featured and manual placements always win over automation.

### Environment variables

```
INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET / INSTAGRAM_REDIRECT_URI
TIKTOK_CLIENT_KEY   / TIKTOK_CLIENT_SECRET    / TIKTOK_REDIRECT_URI
SOCIAL_TOKEN_ENCRYPTION_KEY   # AES-256-GCM key for stored platform tokens
SOCIAL_SYNC_SECRET            # shared secret for the scheduled sync hook
```

Redirect URIs must point at `/api/public/oauth/<platform>/callback`.

### Owner authorization

1. An administrator opens `/admin/connections`.
2. **Connect** starts the official OAuth flow with a CSRF `state` value.
3. On success the token is encrypted server-side; only a reference is stored.
4. A sync is triggered immediately, then every
   `projectConfig.socialFeed.syncIntervalHours` hours via
   `POST /api/public/hooks/social-sync` with the `x-sync-secret` header.

Until this is done every platform honestly reports **disconnected** and the
site shows labelled owner-media placeholders.

### Sync behaviour

Dedupes on `(platform, platform_post_id)`, preserves every administrator
override, marks content that disappears upstream inactive instead of deleting
it, and keeps the last successful public feed when an upstream call fails.
Nothing is scraped and no platform media is rehosted.
