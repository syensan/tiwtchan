import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, getTokenFromReq } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(60, Math.max(6, parseInt(url.searchParams.get('pageSize') || '15', 10)));
  const q = url.searchParams.get('q')?.trim();
  const category = url.searchParams.get('category')?.trim();

  const where: any = {};
  if (q) where.title = { contains: q };
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.media.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  });
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  await db.media.deleteMany({});
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  if (body.id) {
    await db.media.delete({ where: { id: body.id } });
  }
  return NextResponse.json({ ok: true });
}
