import { listMedia } from '@/lib/media-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { items } = await listMedia({ page: 1, pageSize: 5000 });
  const base = 'https://twitchan.com';
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${base}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>\n<url><loc>${base}/?p=about</loc><changefreq>monthly</changefreq></url>\n<url><loc>${base}/?p=policy</loc><changefreq>monthly</changefreq></url>\n${items.map((m) => `<url><loc>${base}/?m=${m.id}</loc>${m.addedAt ? `<lastmod>${new Date(m.addedAt).toISOString()}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  });
}
