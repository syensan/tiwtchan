import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const body = `User-agent: *\nAllow: /\nDisallow: /api/admin\nDisallow: /admin\n\nSitemap: https://twitchan.com/api/sitemap\n`;
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
