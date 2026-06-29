import { NextRequest, NextResponse } from 'next/server';
import { getMediaById } from '@/lib/media-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Proxy to actual file URL (avoids CORS, hides referer, forces Content-Disposition attachment)
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'no id' }, { status: 400 });
  const m = await getMediaById(id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const target = m.videoUrl || m.sourceUrl;
  if (!target) return NextResponse.json({ error: 'no source' }, { status: 400 });

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Referer': 'https://skbj.tv/',
      },
      redirect: 'follow',
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.redirect(target, { status: 302 });
    }
    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    const cl = upstream.headers.get('content-length');
    const safeTitle = (m.title || 'media').replace(/[^\w\d\-_. ]+/g, '_').slice(0, 80);
    const headers: Record<string, string> = {
      'Content-Type': ct,
      'Content-Disposition': `attachment; filename="${safeTitle}.mp4"`,
      'Cache-Control': 'no-store',
    };
    if (cl) headers['Content-Length'] = cl;
    return new NextResponse(upstream.body as any, { status: 200, headers });
  } catch {
    return NextResponse.redirect(target, { status: 302 });
  }
}
