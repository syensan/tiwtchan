// Scraper for 85xo.com (mirror of 85po.com, accessible without Cloudflare block).
// Fetches listing pages for video metadata. Does NOT resolve MP4 URLs at scrape
// time — those are IP-bound and would expire. Instead, the /api/download proxy
// fetches the embed page just-in-time at play time and streams the MP4.
//
// Storage: JSON seed file + Netlify Blobs (see ./media-store)

import { addMedia, addMediaBulk, type MediaItem } from './media-store';

const SOURCE_BASE = 'https://www.85xo.com';

interface ListingCard {
  id: string;
  slug: string;
  sourceUrl: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  quality?: string;
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
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,zh-CN;q=0.7',
};

async function fetchPage(url: string): Promise<string> {
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000), redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return await r.text();
}

// Parse listing pages. Each card:
//   <a href="https://www.85xo.com/v/{id}/{slug}/" title="...">
//     <img data-original="https://www.85xo.com/contents/videos_screenshots/.../1.jpg" />
//     <div class="qualtiy 2k">2K</div>
//     <div class="time">... 0:59</div>
//   </a>
function parseListingCards(html: string): ListingCard[] {
  const cards: ListingCard[] = [];
  const seen = new Set<string>();
  const cardRe = /<a\s+href="(https:\/\/www\.85xo\.com\/v\/(\d+)\/([^/]+)\/)"\s+title="([^"]*)"([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html)) !== null) {
    const sourceUrl = m[1];
    const id = m[2];
    const slug = m[3];
    const titleAttr = decodeHtml(m[4] || '');
    const inner = m[5] || '';
    if (seen.has(id)) continue;
    seen.add(id);
    let title = titleAttr;
    if (!title) {
      const titleDiv = inner.match(/<div class="title"[^>]*>([\s\S]*?)<\/div>/i);
      title = titleDiv ? titleDiv[1].trim() : slug.replace(/[-_]/g, ' ');
    }
    const thumb =
      inner.match(/data-webp="([^"]+)"/i)?.[1] ||
      inner.match(/data-original="([^"]+)"/i)?.[1];
    const durMatch = inner.match(/<div class="time"[^>]*>([\s\S]*?)<\/div>/i);
    let duration: string | undefined;
    if (durMatch) {
      const txt = durMatch[1].replace(/<[^>]+>/g, '').trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(txt)) duration = txt;
    }
    const qMatch = inner.match(/<div class="qualtiy[^"]*"[^>]*>([^<]+)<\/div>/i);
    const quality = qMatch ? qMatch[1].trim() : undefined;
    cards.push({ id, slug, sourceUrl, title: title || slug.replace(/[-_]/g, ' '), thumbnail: thumb, duration, quality });
  }
  return cards;
}

// Scrape multiple listing pages. 85xo.com uses ?from={N} pagination (30 per page).
// Page 1 = homepage, page 2 = ?from=30, page 3 = ?from=60, etc.
export async function scrapeSource(maxPages = 30): Promise<{ added: number; scanned: number }> {
  let scanned = 0;
  const collected: MediaItem[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const from = (page - 1) * 30;
    const url = from === 0 ? `${SOURCE_BASE}/` : `${SOURCE_BASE}/?from=${from}`;
    let cards: ListingCard[] = [];
    try {
      const html = await fetchPage(url);
      cards = parseListingCards(html);
    } catch { continue; }
    if (cards.length === 0) {
      // No more pages
      break;
    }
    let newOnThisPage = 0;
    for (const c of cards) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      scanned++;
      newOnThisPage++;
      collected.push({
        id: c.id,
        title: c.title,
        thumbnail: c.thumbnail || null,
        videoUrl: null, // resolved just-in-time by /api/download proxy
        embedUrl: `${SOURCE_BASE}/embed/${c.id}`,
        sourceUrl: c.sourceUrl,
        duration: c.duration || null,
        category: c.quality || 'main',
      });
    }
    // If all cards on this page were already seen, we've reached the end
    if (newOnThisPage === 0) break;
  }
  const added = await addMediaBulk(collected);
  return { added, scanned };
}

// In-memory cache of resolved MP4 URLs (TTL 5 minutes).
// Keyed by `${videoId}:${quality}`. In Netlify Functions, warm instances
// reuse this cache across requests — saving a fetch per play.
const mp4Cache = new Map<string, { url: string; ts: number }>();
const MP4_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Resolve the direct MP4 URL just-in-time by fetching the full video page.
// The hash in the URL is IP-bound — it only works from the same IP that
// fetched the page. This function must be called from the server that will
// also proxy the stream.
//
// We use the `download=true` variant (not `embed=true`) because it's more
// reliable across different videos.
export async function resolveMp4Url(sourceUrl: string, quality?: '480p' | '720p' | '1080p'): Promise<string | null> {
  const cacheKey = `${sourceUrl}:${quality || 'auto'}`;
  const cached = mp4Cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < MP4_CACHE_TTL) {
    return cached.url;
  }
  try {
    const r = await fetch(sourceUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Find all download=true get_file URLs
    const dlUrls = [...html.matchAll(/(https:\/\/www\.85xo\.com\/get_file\/3\/[a-f0-9]+\/\d+\/\d+\/\d+(?:_\d+p)?\.mp4\/\?download_filename=[^"'\s]+&download=true&br=\d+)/g)].map(m => m[1]);
    if (dlUrls.length === 0) return null;
    // Parse quality from filename: {id}.mp4 = 480p, {id}_720p.mp4 = 720p, {id}_1080p.mp4 = 1080p
    const byQuality: Record<string, string> = {};
    for (const u of dlUrls) {
      if (u.includes('_1080p.')) byQuality['1080p'] = u;
      else if (u.includes('_720p.')) byQuality['720p'] = u;
      else byQuality['480p'] = u;
    }
    if (quality && byQuality[quality]) {
      const url = byQuality[quality];
      mp4Cache.set(cacheKey, { url, ts: Date.now() });
      return url;
    }
    // Default: prefer 720p, then 480p, then 1080p
    const url = byQuality['720p'] || byQuality['480p'] || byQuality['1080p'] || dlUrls[0];
    mp4Cache.set(cacheKey, { url, ts: Date.now() });
    return url;
  } catch {
    return null;
  }
}

export async function scrapeSingleVideo(url: string): Promise<MediaItem | null> {
  const m = url.match(/\/(?:v|embed)\/(\d+)(?:\/([^/?#]+))?/);
  if (!m) return null;
  const id = m[1];
  const slug = m[2] || '';
  const canonical = slug ? `${SOURCE_BASE}/v/${id}/${slug}/` : `${SOURCE_BASE}/v/${id}/`;
  // Fetch the page for title
  let title = slug.replace(/[-_]/g, ' ') || `Video ${id}`;
  try {
    const html = await fetchPage(canonical);
    const t = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1];
    if (t) title = decodeHtml(t);
  } catch { /* ignore */ }
  const thousands = Math.floor(parseInt(id) / 1000) * 1000;
  return {
    id,
    title,
    thumbnail: `${SOURCE_BASE}/contents/videos_screenshots/${thousands}/${id}/390x218/1.jpg`,
    videoUrl: null,
    embedUrl: `${SOURCE_BASE}/embed/${id}`,
    sourceUrl: canonical,
    duration: null,
    category: 'main',
  };
}

export async function addSingleFromUrl(url: string, opts?: { title?: string; thumbnail?: string }) {
  if (!/85xo\.com|85po\.com|85po\.net/.test(url)) {
    throw new Error('URL must be from 85xo.com, 85po.com, or 85po.net');
  }
  const item = await scrapeSingleVideo(url);
  if (!item) throw new Error('Could not parse video URL');
  if (opts?.title) item.title = opts.title;
  if (opts?.thumbnail) item.thumbnail = opts.thumbnail;
  await addMedia(item);
  return item;
}

export async function bulkAdd(urls: string[]): Promise<{ added: number; failed: number }> {
  let added = 0;
  let failed = 0;
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || !/^https?:\/\//i.test(url)) continue;
    try { await addSingleFromUrl(url); added++; } catch { failed++; }
  }
  return { added, failed };
}
