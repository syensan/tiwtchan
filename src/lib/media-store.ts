// JSON-file + Netlify Blobs based media store.
// No database required. Works on Netlify serverless.
//
// Layout:
//   data/media.json  → committed seed file (the "default" media list)
//   Netlify Blobs    → admin-added items (key: "media:additions", "media:deletions")
//
// On local dev (no Blobs available): additions are kept in-memory and also
// persisted to data/media.json so they survive restarts.

import fs from 'fs';
import path from 'path';

export interface MediaItem {
  id: string;
  title: string;
  thumbnail?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
  sourceUrl?: string | null;
  duration?: string | null;
  category?: string | null;
  views?: number;
  addedAt?: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'media.json');
const ADDITIONS_FILE = path.join(process.cwd(), 'data', 'media.additions.json');
const DELETIONS_FILE = path.join(process.cwd(), 'data', 'media.deletions.json');

let blobsAvailable: boolean | null = null;
async function getBlobsStore(): Promise<any | null> {
  if (blobsAvailable === false) return null;
  try {
    // Dynamic import — wrapped so the module is optional in dev
    const mod: any = await (Function('return import("@netlify/blobs")')() as Promise<any>);
    const getStore = mod.getStore || mod.default?.getStore;
    if (!getStore) { blobsAvailable = false; return null; }
    const store = await getStore('twitchan');
    blobsAvailable = true;
    return store;
  } catch {
    blobsAvailable = false;
    return null;
  }
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(file: string, data: any) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {
    /* read-only filesystem on Netlify — ignore */
  }
}

async function getAdditions(): Promise<MediaItem[]> {
  const store = await getBlobsStore();
  if (store) {
    try {
      const raw = await store.get('media:additions');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  return readJsonFile<MediaItem[]>(ADDITIONS_FILE, []);
}

async function setAdditions(items: MediaItem[]) {
  const store = await getBlobsStore();
  if (store) {
    await store.set('media:additions', JSON.stringify(items));
    return;
  }
  writeJsonFile(ADDITIONS_FILE, items);
}

async function getDeletions(): Promise<string[]> {
  const store = await getBlobsStore();
  if (store) {
    try {
      const raw = await store.get('media:deletions');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  return readJsonFile<string[]>(DELETIONS_FILE, []);
}

async function setDeletions(ids: string[]) {
  const store = await getBlobsStore();
  if (store) {
    await store.set('media:deletions', JSON.stringify(ids));
    return;
  }
  writeJsonFile(DELETIONS_FILE, ids);
}

function readSeed(): MediaItem[] {
  const data = readJsonFile<{ media: MediaItem[] }>(DATA_FILE, { media: [] });
  return data.media || [];
}

export async function listMedia(opts?: { page?: number; pageSize?: number; q?: string; category?: string }) {
  const page = Math.max(1, opts?.page || 1);
  const pageSize = Math.min(60, Math.max(6, opts?.pageSize || 15));
  const q = (opts?.q || '').trim().toLowerCase();
  const category = opts?.category;

  const [seed, additions, deletions] = await Promise.all([
    Promise.resolve(readSeed()),
    getAdditions(),
    getDeletions(),
  ]);
  const delSet = new Set(deletions);

  // Merge: additions first (newest), then seed
  const merged: MediaItem[] = [];
  const seen = new Set<string>();
  for (const it of [...additions, ...seed]) {
    if (!it || !it.id) continue;
    if (seen.has(it.id)) continue;
    if (delSet.has(it.id)) continue;
    seen.add(it.id);
    merged.push(it);
  }

  let filtered = merged;
  if (q) {
    filtered = filtered.filter((m) =>
      (m.title || '').toLowerCase().includes(q) ||
      (m.id || '').toLowerCase().includes(q)
    );
  }
  if (category) {
    filtered = filtered.filter((m) => (m.category || 'main') === category);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  const { items } = await listMedia({ page: 1, pageSize: 5000 });
  return items.find((m) => m.id === id) || null;
}

export async function addMedia(item: MediaItem): Promise<MediaItem> {
  const additions = await getAdditions();
  const idx = additions.findIndex((m) => m.id === item.id);
  if (idx >= 0) {
    additions[idx] = { ...additions[idx], ...item };
  } else {
    additions.unshift({ ...item, addedAt: new Date().toISOString() });
  }
  await setAdditions(additions);
  return item;
}

export async function addMediaBulk(items: MediaItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const additions = await getAdditions();
  const byId = new Map(additions.map((m) => [m.id, m]));
  let added = 0;
  for (const it of items) {
    if (!it.id) continue;
    if (byId.has(it.id)) continue;
    byId.set(it.id, { ...it, addedAt: new Date().toISOString() });
    added++;
  }
  await setAdditions([...byId.values()]);
  return added;
}

export async function deleteMedia(id: string): Promise<void> {
  // Remove from additions if present
  const additions = await getAdditions();
  const filtered = additions.filter((m) => m.id !== id);
  if (filtered.length !== additions.length) {
    await setAdditions(filtered);
  }
  // Mark as deleted (covers seed items)
  const deletions = await getDeletions();
  if (!deletions.includes(id)) {
    deletions.push(id);
    await setDeletions(deletions);
  }
}

export async function clearAllMedia(): Promise<void> {
  // Clear additions
  await setAdditions([]);
  // Mark all seed items as deleted
  const seed = readSeed();
  await setDeletions(seed.map((m) => m.id));
}

export async function incrementViews(id: string): Promise<void> {
  // Views are best-effort: store in blobs in-memory only
  try {
    const store = await getBlobsStore();
    if (!store) return;
    const raw = await store.get('media:views');
    const views: Record<string, number> = raw ? JSON.parse(raw) : {};
    views[id] = (views[id] || 0) + 1;
    await store.set('media:views', JSON.stringify(views));
  } catch {}
}

// Record a per-visitor view (deduplicated). visitorHash is the SHA-256 of
// the visitor's random ID, so we never store the raw ID.
export async function recordView(mediaId: string, visitorHash: string): Promise<void> {
  try {
    const store = await getBlobsStore();
    if (!store) return;
    // Use a composite key: mediaId:visitorHash
    const key = `view:${mediaId}:${visitorHash}`;
    const existing = await store.get(key);
    if (existing) return; // already viewed — skip
    await store.set(key, JSON.stringify({ at: Date.now() }));
  } catch {}
}
