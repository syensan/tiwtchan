import { NextRequest, NextResponse } from 'next/server';
import { getMediaById } from '@/lib/media-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stream a direct MP4 file from the upstream provider.
// Forwards Range headers so the in-site <video> player can seek.
// Sets proper Referer so the upstream accepts the request.
// Adds Content-Disposition: attachment when ?download=1 is set.
//
// IMPORTANT: This proxy exists so we can play the video in a native <video>
// tag WITHOUT loading the source site's ad scripts (ExoClick, JuicyAds, etc.
// from hentaiocean.com's embed page). Only our own JuicyAds zones are loaded.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const download = url.searchParams.get('download') === '1';
  if (!id) return NextResponse.json({ error: 'no id' }, { status: 400 });
  const m = await getMediaById(id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const target = m.videoUrl;
  if (!target) {
    // No direct MP4 — redirect to source page as fallback
    if (m.sourceUrl) return NextResponse.redirect(m.sourceUrl, { status: 302 });
    return NextResponse.json({ error: 'no source' }, { status: 400 });
  }

  const fwd: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://w2.hentaiocean.com/',
    'Origin': 'https://w2.hentaiocean.com',
  };
  const range = req.headers.get('range');
  if (range) fwd['Range'] = range;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: fwd,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return NextResponse.redirect(target, { status: 302 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.redirect(target, { status: 302 });
  }

  const outHeaders: Record<string, string> = {
    'Cache-Control': 'public, max-age=3600',
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
