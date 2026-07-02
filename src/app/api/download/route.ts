import { NextRequest, NextResponse } from 'next/server';
import { getMediaById } from '@/lib/media-store';
import { resolveMp4Url } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Just-in-time MP4 proxy:
// 1. Look up the video by ID (from our JSON seed / Netlify Blobs)
// 2. Fetch the embed page from 85xo.com to get the current IP-bound MP4 URL
// 3. Stream the MP4 to the visitor with Range header support
//
// This bypasses Cloudflare (85xo.com is a mirror that doesn't block server-side)
// and avoids loading the source site's ad scripts (ExoClick, etc.) — only our
// own JuicyAds zones are loaded on the page.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const download = url.searchParams.get('download') === '1';
  const quality = (url.searchParams.get('q') as '480p' | '720p' | '1080p') || undefined;
  if (!id) return NextResponse.json({ error: 'no id' }, { status: 400 });

  const m = await getMediaById(id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Resolve the MP4 URL just-in-time by fetching the full video page
  // (IP-bound hash, must be fetched from this server)
  if (!m.sourceUrl) {
    return NextResponse.json({ error: 'no source url' }, { status: 400 });
  }
  let mp4Url = await resolveMp4Url(m.sourceUrl, quality);
  if (!mp4Url) {
    // Fallback: redirect to source page
    return NextResponse.redirect(m.sourceUrl, { status: 302 });
  }

  // Build forward headers
  const fwd: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://www.85xo.com/',
  };
  const range = req.headers.get('range');
  if (range) fwd['Range'] = range;

  let upstream: Response;
  try {
    upstream = await fetch(mp4Url, {
      headers: fwd,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return NextResponse.redirect(mp4Url, { status: 302 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.redirect(mp4Url, { status: 302 });
  }

  const outHeaders: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };
  for (const h of ['content-length', 'content-range', 'accept-ranges', 'content-type']) {
    const v = upstream.headers.get(h);
    if (v) outHeaders[h] = v;
  }
  if (!outHeaders['content-type']) outHeaders['content-type'] = 'video/mp4';
  if (download) {
    const safeTitle = (m.title || 'media').replace(/[^\w\d\-_. ]+/g, '_').slice(0, 80);
    outHeaders['Content-Disposition'] = `attachment; filename="${safeTitle}.mp4"`;
  }

  const status = upstream.status === 206 ? 206 : 200;
  return new NextResponse(upstream.body as any, { status, headers: outHeaders });
}
