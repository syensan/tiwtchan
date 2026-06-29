import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, destroySession, verifySession, getTokenFromReq } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || '');
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
  const token = createSession();
  const res = NextResponse.json({ ok: true, token });
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12,
    path: '/',
  });
  return res;
}

export async function GET(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  const ok = verifySession(token);
  return NextResponse.json({ ok });
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromReq(req as unknown as Request);
  if (token) destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_token');
  return res;
}
