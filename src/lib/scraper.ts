// HentaiOcean API-based scraper.
// Uses the official RSS feed (https://hentaiocean.com/rss.xml) for the video list
// and the per-video API (https://hentaiocean.com/api?action=hentai&slug={slug})
// for detailed metadata.
//
// Documentation: https://hentaiocean.com/api-docs (referenced from user-provided docs)
//
// Storage: JSON seed file + Netlify Blobs (see ./media-store)

import { addMedia, addMediaBulk, type MediaItem } from './media-store';

const SOURCE_BASE = 'https://hentaiocean.com';
const RSS_URL = `${SOURCE_BASE}/rss.xml`;
const API_URL = `${SOURCE_BASE}/api?action=hentai&slug=`;

interface RssItem {
  slug: string;
  title: string;
  link: string;
  embedUrl: string;
  thumbnail: string;     // cover image
  pubDate?: string;
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

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, application/json, */*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return await r.text();
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const r = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return await r.json() as T;
}

// Parse the RSS XML feed. Each <item> contains:
//   <guid>{slug}</guid>
//   <title>{title}</title>
//   <link>{watch url}</link>
//   <pubDate>...</pubDate>
//   <embedUrl>{embed url}</embedUrl>
//   <media:thumbnail url="{cover image}" />
function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const seen = new Set<string>();

  // Match each <item>...</item> block (non-greedy)
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const slug = block.match(/<guid>([^<]+)<\/guid>/i)?.[1]?.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const title = decodeHtml(block.match(/<title>([^<]+)<\/title>/i)?.[1] || slug);
    const link = block.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim() || `${SOURCE_BASE}/watch/${slug}`;
    const embedUrl = block.match(/<embedUrl>([^<]+)<\/embedUrl>/i)?.[1]?.trim() || `${SOURCE_BASE}/embed/${slug}`;
    const thumb = block.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] || '';
    const pubDate = block.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1]?.trim();

    items.push({
      slug,
      title,
      link,
      embedUrl,
      thumbnail: thumb,
      pubDate,
    });
  }
  return items;
}

interface HentaiApiInfo {
  id: number;
  urlname: string;
  videoname: string;
  description: string;
  releasedate: string;
  uploaddate: string;
  coverimg: string;
  series: string | null;
  status: number;
  recentrelease: number;
}
interface HentaiApiResponse {
  info: HentaiApiInfo[];
  genres: { genre: string }[];
}

// Fetch detailed metadata for a single hentai via the API.
// Returns the cover image URL (optcover preferred, fallback to /assets/cover/).
async function fetchVideoMeta(slug: string): Promise<{ genres?: string[]; description?: string; releasedate?: string } | null> {
  try {
    const data = await fetchJson<HentaiApiResponse>(`${API_URL}${encodeURIComponent(slug)}`);
    const info = data.info?.[0];
    if (!info) return null;
    return {
      genres: (data.genres || []).map((g) => g.genre).filter(Boolean),
      description: info.description ? decodeHtml(info.description) : undefined,
      releasedate: info.releasedate,
    };
  } catch {
    return null;
  }
}

// Main scrape: pull RSS feed, optionally enrich each item via the API.
export async function scrapeSource(maxPages = 1, opts?: { enrich?: boolean }): Promise<{ added: number; scanned: number }> {
  // maxPages is kept for API compatibility but RSS returns everything in one go.
  void maxPages;

  const enrich = opts?.enrich !== false; // default: enrich
  let xml: string;
  try {
    xml = await fetchText(RSS_URL);
  } catch {
    return { added: 0, scanned: 0 };
  }

  const rssItems = parseRss(xml);
  if (rssItems.length === 0) return { added: 0, scanned: 0 };

  const collected: MediaItem[] = [];
  const seen = new Set<string>();

  // Enrich in parallel batches of 5 to avoid hammering the API
  const BATCH = 5;
  for (let i = 0; i < rssItems.length; i += BATCH) {
    const batch = rssItems.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (r) => {
        if (seen.has(r.slug)) return null;
        seen.add(r.slug);

        // Prefer the 16:9 thumbnail (per docs), fallback to cover from RSS
        const thumbnail = `${SOURCE_BASE}/thumbnail/${encodeURIComponent(r.slug)}.webp`;

        let category = 'main';
        let description: string | undefined;

        if (enrich) {
          const meta = await fetchVideoMeta(r.slug);
          if (meta?.genres?.length) category = meta.genres[0];
          description = meta?.description;
        }

        return {
          id: r.slug,
          title: r.title,
          thumbnail,
          videoUrl: null,
          embedUrl: `${SOURCE_BASE}/embed/${encodeURIComponent(r.slug)}?la=1`,
          sourceUrl: r.link,
          duration: null,
          category,
          // description is not part of MediaItem — skip storing
        } as MediaItem;
      })
    );
    for (const r of results) if (r) collected.push(r);
  }

  const added = await addMediaBulk(collected);
  return { added, scanned: collected.length };
}

// Add a single video by its /watch/{slug} URL.
export async function scrapeSingleVideo(url: string): Promise<MediaItem | null> {
  // Accept /watch/{slug} or /embed/{slug} or bare slug
  const m = url.match(/\/(?:watch|embed)\/([^/?#]+)/);
  const slug = m ? m[1] : url;
  if (!slug) return null;

  const canonical = `${SOURCE_BASE}/watch/${slug}`;
  const embedUrl = `${SOURCE_BASE}/embed/${slug}?la=1`;
  const thumbnail = `${SOURCE_BASE}/thumbnail/${slug}.webp`;

  // Enrich via API
  let title = slug.replace(/[-_]/g, ' ');
  let category = 'main';
  const meta = await fetchVideoMeta(slug);
  if (meta) {
    if (meta.genres?.length) category = meta.genres[0];
    if (meta.description) {
      // title not in API directly, but videoname equals slug-derived
    }
  }

  // Fetch RSS just to get the title for this slug (cheap, single request)
  try {
    const xml = await fetchText(RSS_URL);
    const items = parseRss(xml);
    const found = items.find((i) => i.slug === slug);
    if (found) title = found.title;
  } catch {
    /* ignore */
  }

  return {
    id: slug,
    title,
    thumbnail,
    videoUrl: null,
    embedUrl,
    sourceUrl: canonical,
    duration: null,
    category,
  };
}

export async function addSingleFromUrl(url: string, opts?: { title?: string; thumbnail?: string; videoUrl?: string }) {
  const item = await scrapeSingleVideo(url);
  if (!item) throw new Error(`Could not parse HentaiOcean URL: ${url}`);
  if (opts?.title) item.title = opts.title;
  if (opts?.thumbnail) item.thumbnail = opts.thumbnail;
  await addMedia(item);
  return item;
}

export async function bulkAdd(urls: string[]): Promise<{ added: number; failed: number }> {
  let added = 0;
  let failed = 0;
  const BATCH = 5;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (raw) => {
        const url = raw.trim();
        if (!url || !/^https?:\/\//i.test(url)) return false;
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
