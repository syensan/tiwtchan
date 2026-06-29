// Test the scraper end-to-end: scrape 2 pages from skbj.tv and insert into DB
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { db } = await import('/home/z/my-project/src/lib/db.ts');
const { scrapeSource } = await import('/home/z/my-project/src/lib/scraper.ts');

console.log('Starting scrape...');
const result = await scrapeSource(5);
console.log('Result:', result);

const count = await db.media.count();
console.log('Total media in DB:', count);

const sample = await db.media.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
console.log('Sample:');
for (const m of sample) {
  console.log(' -', m.title, '|', m.thumbnail, '|', m.duration, '|', m.sourceUrl);
}
process.exit(0);
