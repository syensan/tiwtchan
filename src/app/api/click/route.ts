import { NextRequest, NextResponse } from 'next/server';
import { incrementViews } from '@/lib/media-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (id) await incrementViews(id).catch(() => {});
  return NextResponse.json({ ok: true });
}
