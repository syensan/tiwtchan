import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getTokenFromReq } from '@/lib/auth';
import { scrapeSource } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const pages = Math.min(10, Math.max(1, parseInt(body.pages || '3', 10)));
  try {
    const result = await scrapeSource(pages);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
