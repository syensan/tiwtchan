// Promote data/media.additions.json → data/media.json (commit-ready seed file)
// Run this after a scrape to ship a baseline dataset with the repo.
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const additionsFile = path.join(dataDir, 'media.additions.json');
const deletionsFile = path.join(dataDir, 'media.deletions.json');
const seedFile = path.join(dataDir, 'media.json');

const additions = fs.existsSync(additionsFile)
  ? JSON.parse(fs.readFileSync(additionsFile, 'utf8'))
  : [];
const deletions = fs.existsSync(deletionsFile)
  ? JSON.parse(fs.readFileSync(deletionsFile, 'utf8'))
  : [];
const existing = fs.existsSync(seedFile)
  ? (JSON.parse(fs.readFileSync(seedFile, 'utf8')).media || [])
  : [];

const delSet = new Set(deletions);
const seen = new Set();
const merged = [];
// Additions first (newest), then existing seed items, skip deleted
for (const it of [...additions, ...existing]) {
  if (!it || !it.id) continue;
  if (seen.has(it.id)) continue;
  if (delSet.has(it.id)) continue;
  seen.add(it.id);
  // Strip the addedAt field for the seed file
  const rest = { ...it };
  delete rest.addedAt;
  merged.push(rest);
}

fs.writeFileSync(seedFile, JSON.stringify({ media: merged }, null, 2));
console.log(`Wrote ${merged.length} items to ${seedFile}`);

// Clear additions file since they're now in the seed
fs.writeFileSync(additionsFile, '[]');
fs.writeFileSync(deletionsFile, '[]');
console.log('Cleared additions and deletions files');
