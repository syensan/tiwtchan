#!/usr/bin/env node
// Generate public/sitemap.xml from data/media.json
// Run: node scripts/generate-sitemap.mjs

import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://twitchan.com';
const dataFile = path.join(process.cwd(), 'data', 'media.json');
const outFile = path.join(process.cwd(), 'public', 'sitemap.xml');

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const items = data.media || [];

// Static pages
const staticUrls = [
  { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'hourly' },
  { loc: `${SITE_URL}/?p=about`, priority: '0.3', changefreq: 'monthly' },
  { loc: `${SITE_URL}/?p=policy`, priority: '0.3', changefreq: 'monthly' },
];

// Build XML
const urls = [
  ...staticUrls,
  ...items.map((m) => ({
    loc: `${SITE_URL}/?m=${encodeURIComponent(m.id)}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: m.addedAt ? new Date(m.addedAt).toISOString() : undefined,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(outFile, xml);
console.log(`Wrote ${urls.length} URLs to ${outFile}`);
console.log(`File size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
