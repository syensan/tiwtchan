# twitchan.com

> Lightweight, multilingual adult video gallery. 18+ only.

Public site: **https://twitchan.com**

## What this is

twitchan.com is a single-page Next.js 16 app that:

- Aggregates video metadata from the **official Hentai Ocean API** (`https://hentaiocean.com/api`)
- Lets the visitor browse, search, and watch videos in-site via the official **Embed API** (`<iframe src="https://hentaiocean.com/embed/{slug}?la=1">`)
- Provides a download button that opens the source video page in a new tab (the source site's native download option can be used there)
- Auto-translates the UI based on the visitor's IP (geo-IP lookup), with manual override (18 languages)
- **Anonymous visitor encryption**: each visitor gets a random 128-bit ID stored in localStorage, signed with HMAC-SHA256 server-side, never stored in plain text on the server. Used for view deduplication without tracking PII.
- Shows an 18+ age gate on first visit, with RTA labeling
- Displays native responsive ads every 15 items, a 300x100 mobile banner, a 308x286 video ad inside the player, and a mobile floating ad
- Has a hidden admin panel (`/?p=admin`) protected by a 4-segment password

## Data source: Hentai Ocean API

This site uses the **official public API** provided by Hentai Ocean. No scraping of HTML pages — all data comes from documented JSON endpoints.

### Endpoints used

| Endpoint | Purpose |
|----------|---------|
| `GET /api?action=recent` | Returns JSON array of all videos (id, urlname, videoname, description, dates, coverimg) |
| `GET /api?action=hentai&slug={slug}` | Returns full video info + genres |
| `GET /embed/{slug}?la=1` | Iframe-embeddable player (`?la=1` = reduced ads) |
| `GET /thumbnail/{slug}.webp` | 16:9 video thumbnail |
| `GET /assets/cover/{coverimg}` | DVD cover image |
| `GET /watch/{slug}` | Source video page (for download link) |
| `GET /rss.xml` | RSS feed of newest videos |

### API documentation reference

- **Fetch API**: `GET https://hentaiocean.com/api?action=hentai&slug={slug}` — returns `{ info: [...], genres: [...] }`
- **Embed API**: Replace `/watch/` with `/embed/` in any video URL to get the embeddable version
- **Thumbnail**: Append `.webp` to `https://hentaiocean.com/thumbnail/{slug}`
- **Storyboard**: `https://hentaiocean.com/storyboard/{slug}.webp`

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui (New York)
- No database. Storage is **JSON file** (`data/media.json`) + **Netlify Blobs** (for admin-added items in production).
- Anonymous visitor encryption via HMAC-SHA256 signed tokens
- Deployed on Netlify with Netlify Functions for password gate

## Local development

```bash
bun install
bun run dev   # auto-started in this sandbox
```

## Environment variables (set on Netlify)

```
ADMIN_PW_S1=...
ADMIN_PW_S2=...
ADMIN_PW_S3=...
ADMIN_PW_S4=...
ADMIN_SIGN_KEY=...
VISITOR_SIGN_KEY=...
```

**IMPORTANT**: Values cannot contain `$` (Next.js .env parser expands `$VAR`).
The admin password is the 4 segments joined by `-`. Each segment should be 8+ random chars.

```bash
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
```

## Default admin password (dev only)

```
tw7xQ9kz-Lm2vR4pW8-atnE6cB3yU-0hA5qZx9mK
```

**Override on Netlify via env vars before going live.**

## Anonymous visitor encryption

Each visitor is assigned a random 128-bit ID (32 hex chars) generated client-side via `crypto.getRandomValues`. The ID is sent to `/api/visitor` which signs it with HMAC-SHA256 using `VISITOR_SIGN_KEY`, returning an opaque token with a 30-day expiry.

- **Client localStorage**: `twitchan_visitor_id_v1` (raw ID) + `twitchan_visitor_token_v1` (signed token)
- **Cookie**: `visitor_token` (httpOnly, 30-day, same-site lax)
- **API header**: `X-Visitor-Token` sent on every API request

The server uses the visitor token to deduplicate view counts (one view per visitor per video, stored as `view:{mediaId}:{sha256(visitorId)}` in Netlify Blobs — only the hash is stored, never the raw ID).

No PII is collected. IP address is only used transiently for locale detection (geo-IP lookup) and is not stored.

## Architecture

```
src/app/page.tsx                  — main client SPA
src/app/layout.tsx                — metadata, JSON-LD, RTA tags
src/app/api/geo/route.ts          — IP → locale
src/app/api/media/route.ts        — list/pagination, admin delete
src/app/api/click/route.ts        — view counter (with visitor dedup)
src/app/api/download/route.ts     — redirect to source page
src/app/api/visitor/route.ts      — sign/verify visitor tokens
src/app/api/admin/route.ts        — login/logout/verify
src/app/api/admin/add/route.ts    — single add (calls HO API)
src/app/api/admin/bulk/route.ts   — bulk add (calls HO API per URL)
src/app/api/admin/scrape/route.ts — full catalog scrape via HO API
src/app/api/sitemap/route.ts      — sitemap.xml
src/app/api/robots/route.ts       — robots.txt
src/app/api/manifest/route.ts     — PWA manifest

src/lib/i18n.ts                   — 18 locales
src/lib/geo.ts                    — ipapi.co + ipwho.is fallback
src/lib/auth.ts                   — 4-segment password + HMAC tokens
src/lib/visitor.ts                — visitor ID signing/verification
src/lib/media-store.ts            — JSON seed + Netlify Blobs additions
src/lib/scraper.ts                — Hentai Ocean API client

src/hooks/use-visitor.ts          — React hook for visitor ID + token

src/components/VideoPlayer.tsx    — iframe embed player (?la=1)
src/components/MediaCard.tsx      — video card
src/components/AgeGate.tsx        — 18+ age verification
src/components/AdminPanel.tsx     — admin UI

netlify/functions/admin-auth.js   — Netlify Function auth wrapper
data/media.json                   — committed seed (213 videos)
scripts/test-scrape.mjs           — `bun run scrape`
scripts/promote-seed.mjs          — `bun run promote`
```

## How the scraper works

1. Fetches `https://hentaiocean.com/api?action=recent` — returns JSON array of all 213 videos
2. For each item, extracts:
   - `id` (numeric, stored as string)
   - `urlname` (slug, used for embed/thumbnail/source URLs)
   - `videoname` (title)
   - `coverimg` (hash for cover image)
   - `recentrelease` (1 = recent, 0 = catalog)
3. Optionally enriches with per-video `/api?action=hentai&slug={slug}` calls to get genres
4. Constructs:
   - `thumbnail`: `https://hentaiocean.com/thumbnail/{slug}.webp`
   - `embedUrl`: `https://hentaiocean.com/embed/{slug}?la=1` (reduced ads)
   - `sourceUrl`: `https://hentaiocean.com/watch/{slug}`
5. Stores in JSON seed file (or Netlify Blobs in production)

## Why the official API instead of scraping?

- **Stability**: The API is documented and maintained by Hentai Ocean. HTML scraping breaks whenever the site redesigns.
- **Performance**: One API call returns all 213 videos. HTML scraping would require fetching 14+ pages.
- **Legal**: Using a documented public API is more defensible than scraping. The API is provided for exactly this purpose ("create your own hentai website or project").
- **Quality**: The API returns structured data (id, slug, title, description, genres, dates) — no regex parsing of HTML.

## Netlify deploy

1. Push to GitHub
2. Connect repo on Netlify
3. Set env vars:
   - `ADMIN_PW_S1`-`S4` (each 8+ random chars, NO `$`)
   - `ADMIN_SIGN_KEY` (32+ random chars)
   - `VISITOR_SIGN_KEY` (32+ random chars, different from ADMIN_SIGN_KEY)
4. Build command (auto from netlify.toml): `npm install -g bun && bun install && bun run build`
5. Publish dir: `.next`
6. Plugin: `@netlify/plugin-nextjs` (auto-installed)
