import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getTokenFromReq } from '@/lib/auth';
import { addSingleFromUrl } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const url = String(body.url || '');
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  try {
    const m = await addSingleFromUrl(url, {
      title: body.title,
      thumbnail: body.thumbnail,
      videoUrl: body.videoUrl,
    });
    return NextResponse.json({ ok: true, media: m });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
