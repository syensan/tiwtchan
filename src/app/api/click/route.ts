import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Increment view counter and proxy a redirect to the source
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (id) {
    await db.media.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
