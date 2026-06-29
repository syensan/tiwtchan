// Export current SQLite media to data/media.json
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { db } = await import('/home/z/my-project/src/lib/db.ts');
const fs = await import('fs');
const path = await import('path');

const items = await db.media.findMany({ orderBy: { createdAt: 'desc' } });
const out = items.map((m) => ({
  id: m.externalId || m.id,
  title: m.title,
  thumbnail: m.thumbnail,
  videoUrl: m.videoUrl,
  embedUrl: m.embedUrl || m.sourceUrl,
  sourceUrl: m.sourceUrl,
  duration: m.duration,
  category: m.category || 'main',
  views: m.views,
  addedAt: m.createdAt,
}));

fs.mkdirSync('/home/z/my-project/data', { recursive: true });
fs.writeFileSync('/home/z/my-project/data/media.json', JSON.stringify({ media: out }, null, 2));
console.log('Exported', out.length, 'items to data/media.json');
process.exit(0);
