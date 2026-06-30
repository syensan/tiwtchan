// Test the HentaiOcean scraper with MP4 resolution
const { scrapeSource } = await import('/home/z/my-project/src/lib/scraper.ts');

console.log('Scraping HentaiOcean RSS + resolving direct MP4 URLs...');
// Only first 30 items to keep test fast
const result = await scrapeSource(1, { enrich: false, resolveMp4: true });
console.log('Result:', result);

const { listMedia } = await import('/home/z/my-project/src/lib/media-store.ts');
const data = await listMedia({ page: 1, pageSize: 10 });
console.log('Total in store:', data.total);
console.log('Sample (first 5 with MP4):');
let shown = 0;
for (const m of data.items) {
  if (m.videoUrl) {
    console.log(' -', m.title);
    console.log('   mp4:  ', m.videoUrl);
    console.log('   embed:', m.embedUrl);
    shown++;
    if (shown >= 5) break;
  }
}
console.log('Items without MP4:', data.items.filter(m => !m.videoUrl).length, 'of', data.items.length);
process.exit(0);
