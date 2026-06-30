'use client';

import { useEffect, useRef, useState } from 'react';

// JuicyAds zone IDs (user-provided configuration)
export const AD_ZONES = {
  pcBanner: 1119956,       // 468x60 (desktop)
  mobileBanner: 1119951,   // 300x100 (mobile)
  imageSquare: 1119955,    // 250x250 (sidebar / below video)
  inVideo: 1119953,        // 308x286 (inside video player)
  native: 1119949,         // 108x140 (grid native)
} as const;

export type AdZone = keyof typeof AD_ZONES;

const ZONE_SIZES: Record<AdZone, { w: number; h: number; label: string }> = {
  pcBanner: { w: 468, h: 60, label: 'Banner' },
  mobileBanner: { w: 300, h: 100, label: 'Mobile' },
  imageSquare: { w: 250, h: 250, label: 'Image' },
  inVideo: { w: 308, h: 286, label: 'In-Video' },
  native: { w: 108, h: 140, label: 'Native' },
};

let jadsLoaded = false;
function ensureJads() {
  if (jadsLoaded) return;
  if (typeof window === 'undefined') return;
  if (!(window as any).adsbyjuicy) (window as any).adsbyjuicy = [];
  if (!document.querySelector('script[src*="poweredby.jads.co/js/jads.js"]')) {
    const s = document.createElement('script');
    s.src = 'https://poweredby.jads.co/js/jads.js';
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    document.head.appendChild(s);
  }
  jadsLoaded = true;
}

// Counter for unique ins IDs when the same zone appears multiple times
let adInstanceCounter = 0;

interface AdProps {
  zone: AdZone;
  className?: string;
}

export function Ad({ zone, className = '' }: AdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoneId = AD_ZONES[zone];
  const sz = ZONE_SIZES[zone];
  // Stable unique ID for this ad instance (in case the same zone appears multiple times)
  const instanceIdRef = useRef<string>(`juicy_${zoneId}_${++adInstanceCounter}`);

  useEffect(() => {
    ensureJads();
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous content
    container.innerHTML = '';

    // Create the <ins> element exactly as JuicyAds documentation specifies.
    // The id attribute should be the zone ID. For duplicate zones, we use a
    // unique suffix but keep the data-adzone attribute for jads.js to match.
    const ins = document.createElement('ins');
    ins.id = instanceIdRef.current;
    ins.setAttribute('data-width', String(sz.w));
    ins.setAttribute('data-height', String(sz.h));
    ins.setAttribute('data-adzone', String(zoneId));
    ins.style.display = 'inline-block';
    ins.style.width = sz.w + 'px';
    ins.style.height = sz.h + 'px';
    ins.style.maxWidth = '100%';
    container.appendChild(ins);

    // Push to the JuicyAds queue. jads.js will find this <ins> by its data-adzone
    // attribute and render the ad.
    (window as any).adsbyjuicy = (window as any).adsbyjuicy || [];
    (window as any).adsbyjuicy.push({ adzone: zoneId });

    // Re-push after a short delay in case jads.js hadn't loaded yet when we
    // first pushed. This is a common pattern for async-loaded ad scripts.
    const timer = setTimeout(() => {
      (window as any).adsbyjuicy = (window as any).adsbyjuicy || [];
      (window as any).adsbyjuicy.push({ adzone: zoneId });
    }, 1500);

    return () => clearTimeout(timer);
  }, [zoneId, sz.w, sz.h]);

  return (
    <div
      ref={containerRef}
      className={`ad-container flex items-center justify-center ${className}`}
      style={{ minHeight: sz.h, minWidth: Math.min(sz.w, 320) }}
      aria-label={`Advertisement (${sz.label} ${sz.w}x${sz.h})`}
    />
  );
}

// Conditional desktop / mobile banner
export function ResponsiveBanner({ className = '' }: { className?: string }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return <Ad zone={isMobile ? 'mobileBanner' : 'pcBanner'} className={className} />;
}
