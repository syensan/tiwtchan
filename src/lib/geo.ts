// IP-based locale detection utility (server-side)
import { Locale, localeFromCountry } from './i18n';

interface GeoResult {
  ip: string;
  country?: string;
  countryName?: string;
  locale: Locale;
  source: string;
}

const CACHE_TTL = 60 * 60 * 1000; // 1h
const cache = new Map<string, { ts: number; data: GeoResult }>();

export function getClientIP(req: Request): string {
  const h = req.headers;
  // Common proxy headers
  const xff = h.get('x-forwarded-for') || '';
  const first = xff.split(',')[0].trim();
  if (first) return first;
  return (
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    h.get('x-client-ip') ||
    h.get('true-client-ip') ||
    '0.0.0.0'
  );
}

async function fetchGeo(ip: string): Promise<GeoResult | null> {
  try {
    // Try ipapi.co first
    const r = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const j = await r.json() as any;
      if (j && j.country) {
        return {
          ip,
          country: j.country,
          countryName: j.country_name,
          locale: localeFromCountry(j.country),
          source: 'ipapi.co',
        };
      }
    }
  } catch {
    /* ignore */
  }
  try {
    // Fallback: ipwho.is
    const r = await fetch(`https://ipwho.is/${ip}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const j = await r.json() as any;
      if (j && j.country_code) {
        return {
          ip,
          country: j.country_code,
          countryName: j.country,
          locale: localeFromCountry(j.country_code),
          source: 'ipwho.is',
        };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function detectLocale(req: Request): Promise<GeoResult> {
  const ip = getClientIP(req);
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Skip lookup for local
  if (ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    const result: GeoResult = { ip, locale: 'en', source: 'local' };
    return result;
  }

  const data = (await fetchGeo(ip)) || { ip, locale: 'en' as Locale, source: 'default' };
  cache.set(ip, { ts: Date.now(), data });
  return data;
}
