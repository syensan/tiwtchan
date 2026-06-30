import { NextRequest, NextResponse } from 'next/server';
import { detectLocale } from '@/lib/geo';
import { hashIp, encryptPii } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/geo — returns the visitor's detected locale.
// The IP is used ONLY in-memory for locale detection. The response contains
// a hashed (irreversible) IP fingerprint that the client can use as a
// stable session identifier without revealing the actual IP.
export async function GET(req: NextRequest) {
  const geo = await detectLocale(req as unknown as Request);
  // Hash the IP before returning it — never expose the raw IP to the client.
  // The hash is peppered server-side so it cannot be reversed.
  const ipHash = geo.ip ? hashIp(geo.ip) : '';
  // Optionally encrypt the IP for any downstream processing (transient only)
  const ipEncrypted = geo.ip ? encryptPii(geo.ip) : '';
  return NextResponse.json({
    // Never return raw IP
    ipHash,
    ipEncrypted, // only useful for the server to decrypt later if needed
    country: geo.country,
    countryName: geo.countryName,
    locale: geo.locale,
    source: geo.source,
  });
}
