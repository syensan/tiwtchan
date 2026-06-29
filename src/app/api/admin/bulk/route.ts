import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getTokenFromReq } from '@/lib/auth';
import { bulkAdd } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const text: string = String(body.urls || '');
  const urls = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (urls.length === 0) {
    return NextResponse.json({ error: 'no urls' }, { status: 400 });
  }
  const result = await bulkAdd(urls);
  return NextResponse.json({ ok: true, ...result });
}
