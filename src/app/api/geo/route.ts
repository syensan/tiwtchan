import { NextRequest, NextResponse } from 'next/server';
import { detectLocale } from '@/lib/geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const geo = await detectLocale(req as unknown as Request);
  return NextResponse.json({
    ip: geo.ip,
    country: geo.country,
    countryName: geo.countryName,
    locale: geo.locale,
    source: geo.source,
  });
}
