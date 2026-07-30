# IvyVibing

The internet clubhouse of **Ivy** — the Short Spine Queen and Frog Queen — and her community meme coin **$IVY**.

Built with TanStack Start (React 19 + Vite 7) and Tailwind CSS v4.

---

## Ground rules baked into this codebase

1. **No invented facts.** Token name, contract address, blockchain, supply, taxes, liquidity, launch date, exchanges, partnerships, audits and social handles all live in `src/config/project.ts` and default to `null`, which renders as **Coming Soon**.
2. **No stock or generated dogs.** Every image slot is an explicitly labelled *owner media placeholder*. Only Ivy's family supplies real media.
3. **Nothing is pretended live.** Social sync, OAuth, auth, and the database are scaffolds that report their own unconfigured state.
4. **The public feed never calls a social platform.** `GET /api/social-feed` reads only the local cache / database.

## Getting started

```bash
bun install
bun run dev     # http://localhost:8080
```

## Project map

| Path | Purpose |
| --- | --- |
| `src/config/project.ts` | Unified config: token record, socials, feature flags, sync interval |
| `src/data/social.ts` | Normalized `SocialPost` / `SocialMedia` models + manual fallback feed |
| `src/data/content.ts` | Editable content & legal page seeds |
| `src/routes/index.tsx` | Homepage (all sections) |
| `src/routes/api/social-feed.ts` | Public read-only `GET /api/social-feed` |
| `src/routes/legal.$slug.tsx` | `/legal/terms`, `/privacy`, `/disclaimer`, `/cookies` |
| `src/routes/admin.tsx` | Protected admin dashboard scaffold |
| `src/lib/social-sync.functions.ts` | Instagram/TikTok OAuth + 12-hour sync stubs |
| `src/lib/auth.ts` | Roles, permissions, audit-log types |
| `src/components/ivy/*` | Design-system primitives and homepage sections |
| `db/migrations/` | PostgreSQL schema with RLS + grants |

## Design system

All colors, shadows and type live in `src/styles.css` — never hardcode a color in a component.

| Token | Value |
| --- | --- |
| Frog green | `#83D94E` |
| Deep ivy | `#174F36` |
| Cream | `#FFF8E7` |
| Charcoal | `#151515` |
| Pink | `#FF8EAE` |
| Light leaf | `#C9F39B` |
| Lavender | `#C7B8FF` |
| Yellow | `#FFD86B` |

Display type: Bricolage Grotesque. Body: Nunito. Utilities: `pop`, `pop-static`, `polaroid`, `meadow`, `night`, `wiggle`, `float-slow` — all reduced-motion safe.

## Turning the scaffolds on

### 1. Database + auth
Enable Lovable Cloud, then apply `db/migrations/0001_ivy_init.sql`. Set `features.databaseConnected` and `features.authConfigured` to `true` in `src/config/project.ts` and swap `readCachedFeed()` in `src/data/social.ts` for a database read.

Grant yourself the owner role:

```sql
insert into public.user_roles (user_id, role)
values ('<your-auth-user-id>', 'owner');
```

Roles are stored **only** in `user_roles` — never on a profile row.

### 2. Instagram
Add `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` as project secrets, implement `startOAuthConnect` in `src/lib/social-sync.functions.ts`, then set `features.instagramOAuthConfigured = true`.

### 3. TikTok
Add `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`, then set `features.tiktokOAuthConfigured = true`.

### 4. 12-hour sync
Implement `runScheduledSync`, expose it behind a verified `/api/public/*` route, and schedule it every 12 hours (pg_cron or an external scheduler). The sync writes into `social_posts` / `social_media`; the public API only ever reads.

### 5. Token record
Fill `projectConfig.token` **only** with details that are officially confirmed. Leave everything else `null`.

## Accessibility & performance

- Skip link, landmark regions, single `h1`, labelled sections.
- Radix dialog + accordion for modal and FAQ patterns; the Ivy TV carousel exposes `aria-roledescription`, slide labels and tab dots.
- Visible focus rings on all interactive elements; 44px minimum tap targets on mobile controls.
- Global `prefers-reduced-motion` guard disables every animation.
- No third-party embed loads until the visitor grants consent.
- Fonts preconnected and `display=swap`; no heavy image payloads (placeholders are pure CSS).

## Legal

`/legal/*` pages are seed drafts. Have a qualified legal professional review them before launch.
