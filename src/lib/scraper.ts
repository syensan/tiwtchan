// HentaiOcean API-based scraper.
// Uses the official RSS feed + per-video API + embed page (for direct MP4 URLs).
//
// Documentation: https://hentaiocean.com/api-docs
//
// Strategy:
//   1. Pull RSS feed for the video list (slug + title + cover thumbnail)
//   2. For each video, fetch the /embed/{slug} page and parse the `jsondata`
//      script block, which contains a `mirrors` array with mirror URLs like
//      https://w2.hentaiocean.com/play?vid={filename}
//   3. From the play page, extract the BASE_VIDEO_URL pattern and construct
//      the direct MP4 URL: https://w2.hentaiocean.com/video/{encoded_filename}
//   4. Store the direct MP4 URL so the frontend can use a native <video>
//      player WITHOUT loading the source site's ads (ExoClick, JuicyAds, etc.)
//
// Storage: JSON seed file + Netlify Blobs (see ./media-store)

import { addMedia, addMediaBulk, type MediaItem } from './media-store';

const SOURCE_BASE = 'https://hentaiocean.com';
const W2_BASE = 'https://w2.hentaiocean.com';
const RSS_URL = `${SOURCE_BASE}/rss.xml`;
const API_URL = `${SOURCE_BASE}/api?action=hentai&slug=`;

interface RssItem {
  slug: string;
  title: string;
  link: string;
  embedUrl: string;
  thumbnail: string;
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
  'Accept': 'application/rss+xml, application/xml, text/xml, application/json, text/html, */*;q=0.8',
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

// Parse the RSS XML feed.
function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const seen = new Set<string>();
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const slug = block.match(/<guid>([^<]+)<\/guid>/i)?.[1]?.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    items.push({
      slug,
      title: decodeHtml(block.match(/<title>([^<]+)<\/title>/i)?.[1] || slug),
      link: block.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim() || `${SOURCE_BASE}/watch/${slug}`,
      embedUrl: block.match(/<embedUrl>([^<]+)<\/embedUrl>/i)?.[1]?.trim() || `${SOURCE_BASE}/embed/${slug}`,
      thumbnail: block.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] || '',
      pubDate: block.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1]?.trim(),
    });
  }
  return items;
}

// Fetch the /embed/{slug} page and extract the jsondata block.
// Returns the first mirror's play URL (e.g. https://w2.hentaiocean.com/play?vid=...)
async function fetchEmbedMirrorUrl(slug: string): Promise<string | null> {
  try {
    const html = await fetchText(`${SOURCE_BASE}/embed/${encodeURIComponent(slug)}?la=1`);
    // The jsondata script block contains a JSON object with a `mirrors` array
    const m = html.match(/var\s+jsondata\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
    if (!m) return null;
    let j: any;
    try {
      j = JSON.parse(m[1]);
    } catch {
      return null;
    }
    const mirrors: any[] = j?.mirrors || [];
    if (mirrors.length === 0) return null;
    // Prefer VIP mirror (w2.hentaiocean.com), fallback to first
    const vip = mirrors.find((x) => x.mirrorurl && /w2\.hentaiocean\.com\/play\?/.test(x.mirrorurl));
    return (vip || mirrors[0]).mirrorurl || null;
  } catch {
    return null;
  }
}

// Convert a /play?vid={filename} URL to a direct MP4 URL on /video/{filename}
// The play page does: videoElement.src = BASE_VIDEO_URL + encodeURIComponent(vid)
// where BASE_VIDEO_URL = "https://w2.hentaiocean.com/video/"
function playUrlToMp4(playUrl: string): string | null {
  try {
    const u = new URL(playUrl);
    const vid = u.searchParams.get('vid');
    if (!vid) return null;
    return `${W2_BASE}/video/${encodeURIComponent(vid)}`;
  } catch {
    return null;
  }
}

// Verify an MP4 URL is actually reachable (HEAD check)
async function checkMp4(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': W2_BASE + '/',
      },
      signal: AbortSignal.timeout(8000),
    });
    return r.ok && /video\/mp4/i.test(r.headers.get('content-type') || '');
  } catch {
    return false;
  }
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

// Main scrape: pull RSS, optionally enrich with API + direct MP4 URL.
export async function scrapeSource(maxPages = 1, opts?: { enrich?: boolean; resolveMp4?: boolean }): Promise<{ added: number; scanned: number }> {
  void maxPages;
  const enrich = opts?.enrich !== false;
  const resolveMp4 = opts?.resolveMp4 !== false;

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

  // Process in batches of 3 (each item may fetch embed + API + HEAD = 3 requests)
  const BATCH = 3;
  for (let i = 0; i < rssItems.length; i += BATCH) {
    const batch = rssItems.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (r) => {
        if (seen.has(r.slug)) return null;
        seen.add(r.slug);

        const thumbnail = `${SOURCE_BASE}/thumbnail/${encodeURIComponent(r.slug)}.webp`;
        let category = 'main';
        let mp4Url: string | null = null;

        // Resolve direct MP4 URL (so we can play without source-site ads)
        if (resolveMp4) {
          const playUrl = await fetchEmbedMirrorUrl(r.slug);
          if (playUrl) {
            const candidate = playUrlToMp4(playUrl);
            if (candidate && (await checkMp4(candidate))) {
              mp4Url = candidate;
            }
          }
        }

        // Enrich metadata via API
        if (enrich) {
          const meta = await fetchVideoMeta(r.slug);
          if (meta?.genres?.length) category = meta.genres[0];
        }

        return {
          id: r.slug,
          title: r.title,
          thumbnail,
          videoUrl: mp4Url,
          // If we have a direct MP4, embedUrl is our own proxy; otherwise fall back to HO's embed
          embedUrl: mp4Url || `${SOURCE_BASE}/embed/${encodeURIComponent(r.slug)}?la=1`,
          sourceUrl: r.link,
          duration: null,
          category,
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
  const m = url.match(/\/(?:watch|embed)\/([^/?#]+)/);
  const slug = m ? m[1] : url;
  if (!slug) return null;

  const canonical = `${SOURCE_BASE}/watch/${slug}`;
  const thumbnail = `${SOURCE_BASE}/thumbnail/${slug}.webp`;

  // Resolve MP4
  let mp4Url: string | null = null;
  const playUrl = await fetchEmbedMirrorUrl(slug);
  if (playUrl) {
    const candidate = playUrlToMp4(playUrl);
    if (candidate && (await checkMp4(candidate))) {
      mp4Url = candidate;
    }
  }

  // Title from RSS
  let title = slug.replace(/[-_]/g, ' ');
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
    videoUrl: mp4Url,
    embedUrl: mp4Url || `${SOURCE_BASE}/embed/${slug}?la=1`,
    sourceUrl: canonical,
    duration: null,
    category: 'main',
  };
}

export async function addSingleFromUrl(url: string, opts?: { title?: string; thumbnail?: string; videoUrl?: string }) {
  const item = await scrapeSingleVideo(url);
  if (!item) throw new Error(`Could not parse HentaiOcean URL: ${url}`);
  if (opts?.title) item.title = opts.title;
  if (opts?.thumbnail) item.thumbnail = opts.thumbnail;
  if (opts?.videoUrl) {
    item.videoUrl = opts.videoUrl;
    item.embedUrl = opts.videoUrl;
  }
  await addMedia(item);
  return item;
}

export async function bulkAdd(urls: string[]): Promise<{ added: number; failed: number }> {
  let added = 0;
  let failed = 0;
  const BATCH = 3;
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
