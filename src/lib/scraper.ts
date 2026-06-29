// Media scraper for skbj.tv — fetches listing pages, parses cards.
// Storage layer is in ./media-store (JSON file + Netlify Blobs).

import { addMedia, addMediaBulk, type MediaItem } from './media-store';

const SOURCE_BASE = 'https://skbj.tv';

type RawMedia = MediaItem;

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

const NON_VIDEO_PATHS = new Set([
  '/videos/trending', '/videos/weekly-likes', '/videos/latest', '/videos/popular',
  '/videos/recommended', '/videos/random', '/videos/top', '/videos/new',
  '/videos', '/videos/', '/vip', '/login', '/signup', '/premium',
]);

function isLikelyVideoPath(href: string): boolean {
  if (!href.startsWith('/videos/')) return false;
  const slug = href.replace('/videos/', '').split(/[?#]/)[0];
  if (!slug) return false;
  if (NON_VIDEO_PATHS.has(href) || NON_VIDEO_PATHS.has(`/videos/${slug}`)) return false;
  if (slug.length < 5) return false;
  return true;
}

function parseVideoCards(html: string, baseUrl: string): RawMedia[] {
  const results: RawMedia[] = [];
  const seen = new Set<string>();
  const cardRe = /<a\s+href="(\/videos\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html)) !== null) {
    const href = m[1];
    if (!isLikelyVideoPath(href)) continue;
    const inner = m[3] || '';

    let title =
      inner.match(/<h3[^>]*>([^<]+)<\/h3>/i)?.[1] ||
      inner.match(/alt="([^"]+)"/i)?.[1] ||
      inner.match(/title="([^"]+)"/i)?.[1] ||
      href.split('/').pop() || 'video';
    title = decodeHtml(title.trim());

    const thumb =
      inner.match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
      inner.match(/<img[^>]+data-src="([^"]+)"/i)?.[1];

    let duration: string | undefined;
    const spans = [...inner.matchAll(/<span[^>]*>([^<]+)<\/span>/gi)];
    for (const sm of spans) {
      const txt = (sm[1] || '').trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(txt)) { duration = txt; break; }
    }

    let category: string | undefined;
    if (/VIP/i.test(inner)) category = 'vip';
    else if (/free/i.test(inner)) category = 'free';
    else category = 'main';

    const id = href.split('/').pop() || href;
    if (seen.has(id)) continue;
    seen.add(id);

    results.push({
      id,
      title,
      thumbnail: thumb || undefined,
      sourceUrl: baseUrl + href,
      embedUrl: baseUrl + href,
      duration,
      category,
    });
  }
  return results;
}

async function fetchPage(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

export async function scrapeSource(maxPages = 3): Promise<{ added: number; scanned: number }> {
  let scanned = 0;
  const collected: RawMedia[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= maxPages; page++) {
    const candidates = page === 1
      ? [`${SOURCE_BASE}/?ref=theporf890`, `${SOURCE_BASE}/videos`]
      : [`${SOURCE_BASE}/videos?page=${page}`, `${SOURCE_BASE}/?page=${page}`];
    let cards: RawMedia[] = [];
    for (const url of candidates) {
      try {
        const html = await fetchPage(url);
        cards = parseVideoCards(html, SOURCE_BASE);
        if (cards.length > 0) break;
      } catch { continue; }
    }
    if (cards.length === 0) break;
    for (const c of cards) {
      scanned++;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      collected.push(c);
    }
  }
  const added = await addMediaBulk(collected);
  return { added, scanned };
}

function extractRegex(re: RegExp, html: string, group = 1): string | undefined {
  const m = html.match(re);
  return m ? m[group] : undefined;
}

export async function scrapeSingleVideo(url: string): Promise<RawMedia | null> {
  try {
    const html = await fetchPage(url);
    const id = (url.split('/').pop() || '').split(/[?#]/)[0] || url;
    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    let title = 'Untitled';
    let thumb: string | undefined;
    let mp4: string | undefined;
    let iframeSrc: string | undefined;
    let duration: string | undefined;

    if (ndMatch) {
      try {
        const j = JSON.parse(ndMatch[1]);
        const pp = j?.props?.pageProps || {};
        const v = pp.video || pp.data || pp.item || (Array.isArray(pp.videos) ? pp.videos[0] : null);
        if (v) {
          title = v.title || v.name || title;
          thumb = v.thumbnail || v.thumb || v.preview || v.cover || (Array.isArray(v.thumbnails) ? v.thumbnails[0] : undefined);
          mp4 = v.videoUrl || v.video_url || v.src || v.file || v.mp4 || undefined;
          duration = v.duration || undefined;
        }
      } catch { /* ignore */ }
    }

    title = title === 'Untitled'
      ? (extractRegex(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i, html) ||
         extractRegex(/<title>([^<]+)<\/title>/i, html) || title)
      : title;
    const ogImage = extractRegex(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i, html);
    if (!thumb) {
      thumb = ogImage ||
        extractRegex(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i, html) ||
        undefined;
    }
    if (thumb && thumb.includes('/api/og-image?url=')) {
      try {
        const u = new URL(thumb);
        const inner = u.searchParams.get('url');
        if (inner) thumb = inner;
      } catch {}
    }
    if (!thumb || thumb.includes('/api/og-image')) {
      if (id && id.length > 3) thumb = `https://skbj.b-cdn.net/videos/${id}_1.webp`;
    }
    iframeSrc = iframeSrc ||
      extractRegex(/<iframe[^>]+src="([^"]+)"/i, html) || undefined;
    mp4 = mp4 ||
      extractRegex(/"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/i, html) ||
      extractRegex(/<source[^>]+src="([^"]+\.mp4[^"]*)"/i, html) ||
      extractRegex(/"(?:videoUrl|video_url|src|file)"\s*:\s*"([^"]+\.mp4[^"]*)"/i, html) ||
      undefined;

    return {
      id,
      title: decodeHtml(title.trim()),
      thumbnail: thumb,
      videoUrl: mp4,
      embedUrl: iframeSrc || url,
      sourceUrl: url,
      duration,
      category: 'main',
    };
  } catch {
    return null;
  }
}

export async function addSingleFromUrl(url: string, opts?: { title?: string; thumbnail?: string; videoUrl?: string }) {
  const scraped = await scrapeSingleVideo(url);
  const item: MediaItem = {
    id: scraped?.id || url,
    title: opts?.title || scraped?.title || 'Untitled',
    thumbnail: opts?.thumbnail || scraped?.thumbnail || null,
    videoUrl: opts?.videoUrl || scraped?.videoUrl || null,
    embedUrl: scraped?.embedUrl || url,
    sourceUrl: url,
    duration: scraped?.duration || null,
    category: 'main',
  };
  await addMedia(item);
  return item;
}

export async function bulkAdd(urls: string[]): Promise<{ added: number; failed: number }> {
  let added = 0;
  let failed = 0;
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || !/^https?:\/\//i.test(url)) continue;
    try {
      await addSingleFromUrl(url);
      added++;
    } catch {
      failed++;
    }
  }
  return { added, failed };
}
