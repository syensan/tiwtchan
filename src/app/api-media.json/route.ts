import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

// GET /api-media.json — static media list (generated at build time from data/media.json)
// This is served as a static route so no Function invocation is needed.
export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'media.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const items = (data.media || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      thumbnail: m.thumbnail,
      embedUrl: m.embedUrl,
      sourceUrl: m.sourceUrl,
      duration: m.duration,
      category: m.category,
    }));
    return NextResponse.json({ items, total: items.length }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ items: [], total: 0 }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }
}
