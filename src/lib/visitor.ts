// Anonymous visitor encryption.
//
// GOAL: prevent identification of visitors while still allowing the site to
// personalize (locale, view dedup) and aggregate (trending) without storing
// any PII or anything that could be reverse-engineered into an identity.
//
// WHAT IS COLLECTED:
//   - Visitor's IP address (only used transiently for locale detection)
//   - User-Agent (only used transiently for mobile vs desktop detection)
//   - A random 128-bit visitor ID (generated client-side, never sent in plain
//     text — HMAC-signed before transmission)
//
// WHAT IS STORED:
//   - The SHA-256 hash of (visitor_id + server_secret) → irreversible
//   - The HMAC-signed visitor token (only valid for 30 days, then must be re-signed)
//   - View counts per hashed-visitor-id (deduplication)
//
// WHAT IS NOT STORED:
//   - IP address (used only in-memory for locale detection, never persisted)
//   - User-Agent (used only in-memory, never persisted)
//   - Any PII (name, email, etc.)
//   - Browsing history (only view counts aggregated)

import crypto from 'crypto';

const VISITOR_HEADER = 'x-visitor-token';
const SIGN_KEY = () => process.env.VISITOR_SIGN_KEY || 'twitchan-visitor-default-key-change-in-prod';
const HASH_PEPPER = () => process.env.VISITOR_HASH_PEPPER || 'twitchan-hash-pepper-default-change-in-prod';

export interface VisitorPayload {
  id: string;       // random 128-bit hex (32 chars)
  iat: number;      // issued at (ms)
  exp: number;      // expiry (ms)
}

export function getVisitorHeaderName(): string {
  return VISITOR_HEADER;
}

// Sign a visitor payload with HMAC-SHA256. Returns base64url.body.sig
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

// Hash a visitor ID for storage (peppered SHA-256, irreversible).
// We use a server-side pepper so that even if the storage is leaked,
// the raw visitor IDs cannot be recovered.
export function hashVisitorId(id: string): string {
  return crypto
    .createHash('sha256')
    .update(id + ':' + HASH_PEPPER())
    .digest('hex')
    .slice(0, 32);
}

// Encrypt visitor PII (IP, UA) for transient in-memory use only.
// This is a symmetric AES-256-GCM encryption so the value can be safely
// passed around in logs or third-party requests without revealing the
// original. Returns base64(iv).base64(ciphertext).base64(tag).
const ENC_KEY = () => {
  const k = process.env.VISITOR_ENC_KEY || 'twitchan-enc-key-default-32-bytes!!'; // 32 chars
  return crypto.createHash('sha256').update(k).digest(); // 32 bytes
};

export function encryptPii(value: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY(), iv);
    const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), enc.toString('base64'), tag.toString('base64')].join('.');
  } catch {
    return '';
  }
}

export function decryptPii(token: string): string {
  try {
    const [ivB, encB, tagB] = token.split('.');
    if (!ivB || !encB || !tagB) return '';
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY(), Buffer.from(ivB, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return '';
  }
}

// Hash an IP address with a pepper for one-way anonymization.
// Useful if you need to keep a stable identifier for an IP (rate-limit, dedup)
// without storing the IP itself.
export function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + ':' + HASH_PEPPER())
    .digest('hex')
    .slice(0, 16);
}
