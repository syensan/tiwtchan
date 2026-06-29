import { NextRequest, NextResponse } from 'next/server';
import { signVisitor, verifyVisitor } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/visitor { id } → { token, id, exp }
// Signs a visitor ID with HMAC-SHA256 + expiry. Stateless verification.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');

  // Validate the ID is a 32-char hex string (no PII, no SQL injection risk)
  if (!/^[a-f0-9]{32}$/.test(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  // Check if there's an existing unexpired token in the cookie
  const cookie = req.cookies.get('visitor_token')?.value;
  const existing = verifyVisitor(cookie);
  if (existing && existing.id === id) {
    return NextResponse.json({ token: cookie, id, exp: existing.exp });
  }

  // Sign a new token — 30-day expiry
  const now = Date.now();
  const payload = {
    id,
    iat: now,
    exp: now + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
  const token = signVisitor(payload);

  const res = NextResponse.json({ token, id, exp: payload.exp });
  res.cookies.set('visitor_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}

// GET /api/visitor → verify the current visitor token (if any)
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('visitor_token')?.value;
  const header = req.headers.get('x-visitor-token');
  const token = cookie || header;
  const payload = verifyVisitor(token);
  if (!payload) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, id: payload.id, exp: payload.exp });
}
