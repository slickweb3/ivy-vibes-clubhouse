# IvyVibing — $IVY

The official clubhouse for **$IVY**, the community meme coin inspired by **Ivy**, the
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
3. **No pretend connections.** Instagram and TikTok are shown as *Not
   connected* until real credentials exist. The site never scrapes.
4. **No invented social links.** The Royal Court lists channels with
   *Coming Soon* until a URL is added to `projectConfig.socials`.
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
                             The Lore, Why $IVY, Token Record
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
{ "instagram": [], "tiktok": [], "lastUpdated": null,
  "status": { "instagram": "not_configured", "tiktok": "not_configured" } }
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

| Platform  | Required secrets |
|-----------|------------------|
| Instagram | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` |
| TikTok    | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` |
| Sync hook | `SOCIAL_SYNC_SECRET` |

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

$IVY is a community meme project. Digital assets are highly speculative and may
lose all value. Nothing in this repository or on the website is financial,
legal or tax advice. Instagram, TikTok and other platforms do not sponsor or
endorse this project.
