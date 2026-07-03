import fs from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'media.json');
const outFile = path.join(process.cwd(), 'public', 'api-media.json');

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const items = data.media || [];

// Output a lightweight version (only fields needed by the client)
const out = {
  items: items.map(m => ({
    id: m.id,
    title: m.title,
    thumbnail: m.thumbnail,
    embedUrl: m.embedUrl,
    sourceUrl: m.sourceUrl,
    duration: m.duration,
    category: m.category,
  })),
  total: items.length,
};

fs.writeFileSync(outFile, JSON.stringify(out));
console.log(`Wrote ${items.length} items to ${outFile}`);
console.log(`File size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
