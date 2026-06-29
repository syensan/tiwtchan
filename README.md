# twitchan.com

> Curated, lightweight, multilingual adult media gallery. 18+ only.

Public site: **https://twitchan.com**

## What this is

twitchan.com is a single-page Next.js 16 app that:

- Aggregates publicly-listed video links from a third-party provider (`skbj.tv`)
- Lets the visitor browse, search, and watch videos in-site (iframe embed)
- Provides one-click download via a server-side proxy that strips referer and forces `Content-Disposition: attachment`
- Auto-translates the UI based on the visitor's IP (geo-IP lookup), with manual override
- Shows an 18+ age gate on first visit, with RTA labeling
- Displays native responsive ads every 15 items, a 300x100 mobile banner, a 308x286 video ad inside the player, and a mobile floating ad
- Has a hidden admin panel (`/?p=admin` or top-nav Admin) protected by a 4-segment password, where the admin can:
  - Add a single video by URL
  - Bulk-add by pasting many URLs (one per line)
  - Trigger a full scrape of the source site homepage (up to 10 pages)
  - Clear all media

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui (New York)
- Prisma ORM + SQLite (local) / PostgreSQL (production-ready)
- Native fetch (no axios)
- Deployed on Netlify with Netlify Functions for password gate

## Local development

```bash
bun install
bun run db:push
bun run dev   # auto-started in this sandbox
```

Open the preview at the URL provided by your platform.

## Environment variables (set on Netlify)

```
DATABASE_URL=file:./db/custom.db   # or a real Postgres URL
ADMIN_PW_S1=...
ADMIN_PW_S2=...
ADMIN_PW_S3=...
ADMIN_PW_S4=...
```

The admin password is the 4 segments joined by `-`. Each segment should be a random string of at least 6 characters mixing upper/lower/digits/symbols. Example generator:

```bash
node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"
```

## Architecture

```
src/app/page.tsx                  — main client SPA (single user-visible route)
src/app/layout.tsx                — metadata, JSON-LD, RTA tags
src/app/api/geo/route.ts          — IP -> locale
src/app/api/media/route.ts        — list/pagination, admin delete
src/app/api/click/route.ts        — view counter
src/app/api/download/route.ts     — download proxy
src/app/api/admin/route.ts        — login/logout/verify (cookie + bearer)
src/app/api/admin/add/route.ts    — single add
src/app/api/admin/bulk/route.ts   — bulk add
src/app/api/admin/scrape/route.ts — scraper (max 10 pages)
src/app/api/sitemap/route.ts      — sitemap.xml
src/app/api/robots/route.ts       — robots.txt
src/app/api/manifest/route.ts     — PWA manifest

src/lib/i18n.ts                   — 18 locales
src/lib/geo.ts                    — ipapi.co + ipwho.is fallback
src/lib/auth.ts                   — 4-segment password + session DB
src/lib/scraper.ts                — source parser
netlify/functions/admin-auth.ts   — Netlify Function wrapper for the same auth
```

## Notes for LLMs / agents

- The only user-visible route is `/`. All navigation is client-side state.
- All API requests use relative paths only.
- The site is intentionally lightweight: no analytics, no tracking cookies, no popup traps.
- Adult content is embedded from third-party providers; we do not host any media files.
