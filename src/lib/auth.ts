// Admin auth — pure HMAC-signed tokens, no DB needed.
// Works on Netlify serverless.
//
// Password is composed of 4 segments loaded from env vars.
// The full password is: S1-S2-S3-S4
//
// Set on Netlify:
//   ADMIN_PW_S1, ADMIN_PW_S2, ADMIN_PW_S3, ADMIN_PW_S4
//   ADMIN_SIGN_KEY (random 32+ char string used to sign tokens)

import crypto from 'crypto';

function env(key: string, fallback = ''): string {
  return (process.env[key] || fallback).trim();
}

export function getExpectedPassword(): string {
  const s1 = env('ADMIN_PW_S1');
  const s2 = env('ADMIN_PW_S2');
  const s3 = env('ADMIN_PW_S3');
  const s4 = env('ADMIN_PW_S4');
  if (s1 || s2 || s3 || s4) return [s1, s2, s3, s4].filter(Boolean).join('-');
  // Default fallback (local dev only — override on Netlify)
  return 'tw-7xQ9!kz-Lm2-vR4$pW8-@nE6-cB3^yU-0&hA5-qZx9#mK';
}

function getSignKey(): string {
  return env('ADMIN_SIGN_KEY', 'twitchan-default-sign-key-change-in-prod');
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  return timingSafeEqualStr(sha256(input), sha256(getExpectedPassword()));
}

interface TokenPayload {
  exp: number;
  iat: number;
}

export function createSession(): string {
  const payload: TokenPayload = {
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12h
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSignKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', getSignKey()).update(body).digest('base64url');
  if (!timingSafeEqualStr(sig, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function destroySession(_token: string): void {
  // Stateless tokens — no server-side destroy needed.
  // Client should delete the cookie.
}

export function getTokenFromReq(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const c = req.headers.get('cookie') || '';
  const m = c.match(/admin_token=([^;]+)/);
  if (m) return m[1];
  const u = new URL(req.url);
  const t = u.searchParams.get('token');
  if (t) return t;
  return null;
}
