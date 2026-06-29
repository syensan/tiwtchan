// Debug: scrape a single video page and show what we extract
const { scrapeSingleVideo } = await import('/home/z/my-project/src/lib/scraper.ts');
const url = 'https://www.freeones.com/video/x-art-hottie-gets-naked-and-teases-on-the-couch';
const item = await scrapeSingleVideo(url);
console.log('Result:', item);
process.exit(0);
