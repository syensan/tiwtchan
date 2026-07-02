import { NextRequest, NextResponse } from 'next/server';
import { getMediaById } from '@/lib/media-store';
import { resolveMp4Url } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// COST OPTIMIZATION: Instead of streaming the full MP4 through our server
// (which was burning ~1,311 GB-hour of Netlify Compute per day), we resolve
// the MP4 URL and return a 302 redirect. The visitor's browser fetches the MP4
// directly from 85xo.com, saving all the streaming bandwidth.
//
// The only cost now is the small fetch of the video page (~100KB) to extract
// the IP-bound MP4 URL — about 1000x cheaper than streaming 100MB+ per play.
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

  // Resolve the MP4 URL (small fetch — only the HTML page, ~100KB)
  const mp4Url = await resolveMp4Url(m.sourceUrl, quality);
  if (!mp4Url) {
    return NextResponse.redirect(m.sourceUrl, { status: 302 });
  }

  // 302 redirect — browser streams MP4 directly from 85xo.com
  // For downloads, append download=true to force attachment (85xo supports it)
  if (download) {
    // The resolved URL already has download=true in it
    return NextResponse.redirect(mp4Url, { status: 302 });
  }
  return NextResponse.redirect(mp4Url, { status: 302 });
}
