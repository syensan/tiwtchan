import { NextRequest, NextResponse } from 'next/server';
import { getMediaById } from '@/lib/media-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Since 85xo.com MP4 URLs are IP-bound and cannot be proxied server-side,
// this endpoint simply redirects to the source video page where the user
// can use the site's native download option.
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'no id' }, { status: 400 });
  const m = await getMediaById(id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!m.sourceUrl) return NextResponse.json({ error: 'no source' }, { status: 400 });
  return NextResponse.redirect(m.sourceUrl, { status: 302 });
}
