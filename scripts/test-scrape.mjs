// Scrape ALL pages from 85xo.com
const { scrapeSource } = await import('/home/z/my-project/src/lib/scraper.ts');

console.log('Scraping ALL pages from 85xo.com (up to 40 pages)...');
const result = await scrapeSource(40);
console.log('Result:', result);

const { listMedia } = await import('/home/z/my-project/src/lib/media-store.ts');
const data = await listMedia({ page: 1, pageSize: 5 });
console.log('Total in store:', data.total);
process.exit(0);
