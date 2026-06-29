// Test the new hentaiocean.com API scraper
const { scrapeSource } = await import('/home/z/my-project/src/lib/scraper.ts');

console.log('Scraping hentaiocean.com via official API (with genre enrichment)...');
const result = await scrapeSource(1, { enrichGenres: true });
console.log('Result:', result);

const { listMedia } = await import('/home/z/my-project/src/lib/media-store.ts');
const data = await listMedia({ page: 1, pageSize: 5 });
console.log('Total in store:', data.total);
console.log('Sample:');
for (const m of data.items) {
  console.log(' -', m.title);
  console.log('   thumb:', m.thumbnail);
  console.log('   embed:', m.embedUrl);
  console.log('   src:  ', m.sourceUrl);
  console.log('   cat:  ', m.category);
}
process.exit(0);
