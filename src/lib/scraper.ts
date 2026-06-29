// Media scraper for hentaiocean.com — uses the official API.
//
// API documentation:
//   GET /api?action=recent → JSON array of all videos (id, urlname, videoname, description, dates, coverimg)
//   GET /api?action=hentai&slug={slug} → JSON with full info + genres
//   GET /embed/{slug} → iframe-embeddable player (works from visitor's browser)
//   GET /thumbnail/{slug}.webp → 16:9 thumbnail
//   GET /assets/cover/{coverimg} → DVD cover image
//   GET /rss.xml → RSS feed of newest videos
//
// We use /api?action=recent to get the full list, then optionally enrich
// with per-video /api?action=hentai&slug= calls to get genres.
//
// Storage: JSON seed file (data/media.json) + Netlify Blobs for admin additions.

import { addMedia, addMediaBulk, type MediaItem } from './media-store';

const SOURCE_BASE = 'https://hentaiocean.com';

interface ApiListItem {
  id: number;
  urlname: string;
  videoname: string;
  description?: string;
  releasedate?: string;
  uploaddate?: string;
  coverimg?: string;
  series?: string | null;
  recentrelease?: number;
}

interface ApiHentaiInfo extends ApiListItem {
  status?: number;
}

interface ApiHentaiResponse {
  info?: ApiHentaiInfo[];
  genres?: { genre: string }[];
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json,text/html,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return await r.json();
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Convert an ApiListItem to a MediaItem.
// - id: numeric ID from the API (stored as string for consistency)
// - slug: urlname (used for embed/thumbnail/source URLs)
// - thumbnail: prefer 16:9 thumbnail endpoint, fallback to cover image
// - embedUrl: official embed endpoint with ?la=1 (reduced ads)
// - sourceUrl: /watch/{slug} on the source site
// - category: "Recent" if recentrelease=1, else "Catalog"
function toItem(item: ApiListItem, genres?: string[]): MediaItem {
  const slug = item.urlname;
  const thumbnail = `${SOURCE_BASE}/thumbnail/${slug}.webp`;
  const cover = item.coverimg ? `${SOURCE_BASE}/assets/cover/${item.coverimg}` : undefined;
  return {
    id: String(item.id),
    title: decodeHtml(item.videoname || slug),
    thumbnail,
    videoUrl: null, // not stored — embed via iframe
    embedUrl: `${SOURCE_BASE}/embed/${slug}?la=1`,
    sourceUrl: `${SOURCE_BASE}/watch/${slug}`,
    duration: null, // API does not return duration
    category: item.recentrelease === 1 ? 'Recent' : (genres?.[0] || 'Catalog'),
  };
}

// Fetch the full list via /api?action=recent. Returns all items.
export async function fetchList(): Promise<ApiListItem[]> {
  const data = await fetchJson(`${SOURCE_BASE}/api?action=recent`);
  if (!Array.isArray(data)) {
    throw new Error('Unexpected API response (expected array)');
  }
  return data as ApiListItem[];
}

// Fetch per-video details (genres). Best-effort — returns undefined on failure.
export async function fetchDetails(slug: string): Promise<{ genres: string[] } | null> {
  try {
    const data: ApiHentaiResponse = await fetchJson(
      `${SOURCE_BASE}/api?action=hentai&slug=${encodeURIComponent(slug)}`
    );
    const genres = (data.genres || []).map((g) => g.genre).filter(Boolean);
    return { genres };
  } catch {
    return null;
  }
}

// Scrape the entire catalog (or first N items if maxItems is set).
// If enrichGenres is true, fetches per-video details to get genres.
export async function scrapeSource(maxPages = 1, opts?: { enrichGenres?: boolean; maxItems?: number }): Promise<{ added: number; scanned: number }> {
  const enrich = opts?.enrichGenres ?? false;
  const maxItems = opts?.maxItems ?? 0; // 0 = all

  const list = await fetchList();
  const items = maxItems > 0 ? list.slice(0, maxItems) : list;

  const collected: MediaItem[] = [];
  for (const apiItem of items) {
    let genres: string[] | undefined;
    if (enrich) {
      const details = await fetchDetails(apiItem.urlname);
      genres = details?.genres;
    }
    collected.push(toItem(apiItem, genres));
  }

  const added = await addMediaBulk(collected);
  return { added, scanned: items.length };
}

// Add a single video by its URL (https://hentaiocean.com/watch/{slug}).
export async function scrapeSingleVideo(url: string): Promise<MediaItem | null> {
  // Accept /watch/{slug}, /embed/{slug}, or just {slug}
  const m = url.match(/(?:watch|embed)\/([^/?#]+)/);
  const slug = m ? m[1] : url;
  if (!slug) return null;

  try {
    const data: ApiHentaiResponse = await fetchJson(
      `${SOURCE_BASE}/api?action=hentai&slug=${encodeURIComponent(slug)}`
    );
    const info = data.info?.[0];
    if (!info) return null;
    const genres = (data.genres || []).map((g) => g.genre).filter(Boolean);
    return toItem(info, genres);
  } catch {
    return null;
  }
}

export async function addSingleFromUrl(url: string, opts?: { title?: string; thumbnail?: string; videoUrl?: string }) {
  // Accept hentaiocean.com URLs OR raw slugs
  const isUrl = /^https?:\/\//.test(url);
  if (isUrl && !/hentaiocean\.com/.test(url)) {
    throw new Error('URL must be from hentaiocean.com');
  }

  const item = await scrapeSingleVideo(url);
  if (!item) {
    throw new Error('Could not fetch video — check the slug or URL');
  }

  // Override with provided values
  if (opts?.title) item.title = opts.title;
  if (opts?.thumbnail) item.thumbnail = opts.thumbnail;

  await addMedia(item);
  return item;
}

export async function bulkAdd(urls: string[]): Promise<{ added: number; failed: number }> {
  let added = 0;
  let failed = 0;
  // Process in parallel batches of 5
  const BATCH = 5;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (raw) => {
        const url = raw.trim();
        if (!url) return false;
        try {
          await addSingleFromUrl(url);
          return true;
        } catch {
          return false;
        }
      })
    );
    for (const ok of results) {
      if (ok) added++;
      else failed++;
    }
  }
  return { added, failed };
}
