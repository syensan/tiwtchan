// Anonymous visitor encryption.
//
// Each visitor gets a random 128-bit ID generated client-side, stored in
// localStorage. The ID is never sent in plain text — it is HMAC-signed
// with a server-side secret, producing an opaque token that the server
// uses to identify the visitor without storing any PII.
//
// The token is sent as the `X-Visitor-Token` header on every API request.
// The server can use this to:
//   - Rate-limit anonymous users
//   - Track view counts per visitor (without storing IP)
//   - Personalize the experience (favorites, history) without login
//
// What is stored:
//   - Client localStorage: visitor_id (random 32 hex chars)
//   - Server-side: nothing (stateless HMAC verification)
//
// What is NOT stored:
//   - IP address (only used transiently for locale detection)
//   - Any PII (name, email, etc.)
//   - Browsing history (only view counts aggregated in Netlify Blobs)

import crypto from 'crypto';

const VISITOR_HEADER = 'x-visitor-token';
const SIGN_KEY = () => process.env.VISITOR_SIGN_KEY || 'twitchan-visitor-default-key-change-in-prod';

export interface VisitorPayload {
  id: string;       // random 128-bit hex (32 chars)
  iat: number;      // issued at (ms)
  exp: number;      // expiry (ms)
}

export function getVisitorHeaderName(): string {
  return VISITOR_HEADER;
}

// Sign a visitor ID + payload with HMAC-SHA256. Returns base64url.
export function signVisitor(payload: VisitorPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SIGN_KEY()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

// Verify a visitor token. Returns the payload if valid, null otherwise.
export function verifyVisitor(token?: string | null): VisitorPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', SIGN_KEY()).update(body).digest('base64url');
  // Constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as VisitorPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Extract visitor token from request headers
export function getVisitorFromReq(req: Request): VisitorPayload | null {
  const token = req.headers.get(VISITOR_HEADER);
  return verifyVisitor(token);
}

// Hash a visitor ID for storage (so we never store the raw ID, only its hash)
export function hashVisitorId(id: string): string {
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 32);
}
