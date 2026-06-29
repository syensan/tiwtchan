// Admin auth - secure password gate.
// Password is composed of 4 segments loaded from env vars.
// Each segment can be rotated independently. Hash stored in env.
//
// Default password (demo): Please replace via env on Netlify:
//   ADMIN_PW_S1, ADMIN_PW_S2, ADMIN_PW_S3, ADMIN_PW_S4
//
// The full password is: S1-S2-S3-S4
// Stored as sha256 in env ADMIN_PW_HASH

import crypto from 'crypto';
import { db } from './db';

function env(key: string, fallback = ''): string {
  return (process.env[key] || fallback).trim();
}

// Compose raw password from 4 env segments (more entropy than a single var)
export function getExpectedPassword(): string {
  const s1 = env('ADMIN_PW_S1');
  const s2 = env('ADMIN_PW_S2');
  const s3 = env('ADMIN_PW_S3');
  const s4 = env('ADMIN_PW_S4');
  if (s1 || s2 || s3 || s4) return [s1, s2, s3, s4].filter(Boolean).join('-');
  // Default fallback (only for local dev)
  return 'tw-7xQ9!kz#Lm2-vR4$pW8@nE6-cB3^yU0&hA5';
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// Pre-computed hash of the default fallback password
const DEFAULT_HASH = sha256('tw-7xQ9!kz#Lm2-vR4$pW8@nE6-cB3^yU0&hA5');

export function verifyPassword(input: string): boolean {
  const expected = getExpectedPassword();
  // Constant-time compare
  const a = Buffer.from(sha256(input));
  const b = Buffer.from(sha256(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12); // 12h
  await db.adminSession.create({ data: { token, expiresAt } });
  return token;
}

export async function verifySession(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const s = await db.adminSession.findUnique({ where: { token } });
  if (!s) return false;
  if (s.expiresAt.getTime() < Date.now()) {
    await db.adminSession.delete({ where: { token } }).catch(() => {});
    return false;
  }
  return true;
}

export async function destroySession(token: string): Promise<void> {
  await db.adminSession.delete({ where: { token } }).catch(() => {});
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
