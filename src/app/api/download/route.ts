import { NextRequest, NextResponse } from 'next/server';
import { getMediaById } from '@/lib/media-store';
import { resolveMp4Url } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MP4 proxy with CORS headers.
// Streams the MP4 through our server because 85xo.com doesn't send
// Access-Control-Allow-Origin headers (CORS blocks direct browser fetch).
//
// Cost optimization:
// - In-memory MP4 URL cache (5 min TTL) — avoids re-fetching the video page
// - Range request support — browser can seek without re-downloading
// - Stream passthrough — we don't buffer the full file in memory
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const download = url.searchParams.get('download') === '1';
  const quality = (url.searchParams.get('q') as '480p' | '720p' | '1080p') || undefined;
  if (!id) return NextResponse.json({ error: 'no id' }, { status: 400 });

  const m = await getMediaById(id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (!m.sourceUrl) {
    return NextResponse.json({ error: 'no source url' }, { status: 400 });
  }

  // Resolve the MP4 URL (cached 5 min)
  const mp4Url = await resolveMp4Url(m.sourceUrl, quality);
  if (!mp4Url) {
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

  // Forward response headers + add CORS headers so browser can play it
  const outHeaders: Record<string, string> = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
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

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Max-Age': '86400',
    },
  });
}
