import { NextRequest, NextResponse } from 'next/server';
import { incrementViews, recordView } from '@/lib/media-store';
import { getVisitorFromReq, hashVisitorId } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Record a view for the given media item. The visitor token (if present)
// is used to deduplicate views per-anonymous-user — we only count one view
// per visitor per video. The visitor ID is hashed before storage so the
// raw ID is never persisted.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'no id' }, { status: 400 });

  const visitor = getVisitorFromReq(req as unknown as Request);
  const visitorHash = visitor ? hashVisitorId(visitor.id) : 'anonymous';

  // Increment total view count (always)
  await incrementViews(id).catch(() => {});

  // Record per-visitor view (deduplicated in store)
  await recordView(id, visitorHash).catch(() => {});

  return NextResponse.json({ ok: true });
}
