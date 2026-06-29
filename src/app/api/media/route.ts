import { NextRequest, NextResponse } from 'next/server';
import { listMedia, deleteMedia, clearAllMedia } from '@/lib/media-store';
import { verifySession, getTokenFromReq } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '15', 10);
  const q = url.searchParams.get('q') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const result = await listMedia({ page, pageSize, q, category });
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id) {
    await deleteMedia(id);
  } else {
    await clearAllMedia();
  }
  return NextResponse.json({ ok: true });
}
