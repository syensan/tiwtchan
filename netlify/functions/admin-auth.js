// Netlify Function: admin-auth
// Acts as an external password gate. The same 4-segment password is used,
// but this function validates without touching the SQLite DB and returns
// a short-lived signed token that the app accepts as an alternative to
// the in-DB session.
//
// Env vars (set on Netlify):
//   ADMIN_PW_S1, ADMIN_PW_S2, ADMIN_PW_S3, ADMIN_PW_S4
//   ADMIN_SIGN_KEY (random 32+ char string; used to HMAC-sign tokens)

const crypto = require('crypto');

function getExpectedPassword() {
  const s1 = process.env.ADMIN_PW_S1 || '';
  const s2 = process.env.ADMIN_PW_S2 || '';
  const s3 = process.env.ADMIN_PW_S3 || '';
  const s4 = process.env.ADMIN_PW_S4 || '';
  if (s1 || s2 || s3 || s4) return [s1, s2, s3, s4].filter(Boolean).join('-');
  // dev-only fallback — must be overridden in production
  return 'tw-7xQ9!kz#Lm2-vR4$pW8@nE6-cB3^yU0&hA5';
}

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function sign(payload, key) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

exports.handler = async (event) => {
  const method = (event.httpMethod || 'POST').toUpperCase();
  const SIGN_KEY = process.env.ADMIN_SIGN_KEY || 'twitchan-default-sign-key-change-me';

  if (method === 'GET') {
    // Verify token from query
    const tok = (event.queryStringParameters || {}).token || '';
    if (!tok) {
      return { statusCode: 401, body: JSON.stringify({ ok: false }) };
    }
    const [body, sig] = tok.split('.');
    if (!body || !sig) return { statusCode: 401, body: JSON.stringify({ ok: false }) };
    const expected = crypto.createHmac('sha256', SIGN_KEY).update(body).digest('base64url');
    if (!timingSafeEqualStr(sig, expected)) {
      return { statusCode: 401, body: JSON.stringify({ ok: false }) };
    }
    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp < Date.now()) return { statusCode: 401, body: JSON.stringify({ ok: false }) };
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch {
      return { statusCode: 401, body: JSON.stringify({ ok: false }) };
    }
  }

  if (method !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid json' }) };
  }

  const password = String(body.password || '');
  if (!password) return { statusCode: 400, body: JSON.stringify({ error: 'no password' }) };

  if (!timingSafeEqualStr(sha256(password), sha256(getExpectedPassword()))) {
    return { statusCode: 401, body: JSON.stringify({ error: 'invalid' }) };
  }

  const payload = { exp: Date.now() + 1000 * 60 * 60 * 12 };
  const token = sign(payload, SIGN_KEY);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `admin_token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=43200; Path=/`,
    },
    body: JSON.stringify({ ok: true, token }),
  };
};
