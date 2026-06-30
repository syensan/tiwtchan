'use client';

import { useEffect, useRef, useState } from 'react';

// JuicyAds zone IDs (user-provided configuration)
// PC banner:   1119956  (468x60)
// Mobile:      1119951  (300x100)
// Image:       1119955  (250x250)
// In-video:    1119953  (308x286)
// Native:      1119949  (108x140)  — for grid insertion
export const AD_ZONES = {
  pcBanner: 1119956,       // 468x60 (desktop)
  mobileBanner: 1119951,   // 300x100 (mobile)
  imageSquare: 1119955,    // 250x250 (sidebar / below video)
  inVideo: 1119953,        // 308x286 (inside video player)
  native: 1119949,         // 108x140 (grid native)
} as const;

export type AdZone = keyof typeof AD_ZONES;

let jadsLoaded = false;
function ensureJads() {
  if (jadsLoaded) return;
  if (typeof window === 'undefined') return;
  if (!(window as any).adsbyjuicy) (window as any).adsbyjuicy = [];
  const s = document.createElement('script');
  s.src = 'https://poweredby.jads.co/js/jads.js';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
  jadsLoaded = true;
}

interface AdProps {
  zone: AdZone;
  className?: string;
  // Optional: render with a fixed wrapper width so the ad container doesn't
  // collapse before JuicyAds injects the iframe
  wrapperClassName?: string;
}

const ZONE_SIZES: Record<AdZone, { w: number; h: number; label: string }> = {
  pcBanner: { w: 468, h: 60, label: 'Banner' },
  mobileBanner: { w: 300, h: 100, label: 'Mobile' },
  imageSquare: { w: 250, h: 250, label: 'Image' },
  inVideo: { w: 308, h: 286, label: 'In-Video' },
  native: { w: 108, h: 140, label: 'Native' },
};

export function Ad({ zone, className = '', wrapperClassName = '' }: AdProps) {
  const ref = useRef<HTMLInsElement>(null);
  const zoneId = AD_ZONES[zone];
  const sz = ZONE_SIZES[zone];

  useEffect(() => {
    ensureJads();
    const id = `ad-${zone}-${Math.random().toString(36).slice(2, 8)}`;
    if (ref.current) {
      ref.current.id = id;
      ref.current.setAttribute('data-adzone', String(zoneId));
    }
    try {
      (window as any).adsbyjuicy = (window as any).adsbyjuicy || [];
      (window as any).adsbyjuicy.push({ adzone: zoneId });
    } catch {}
  }, [zoneId]);

  return (
    <div
      className={`ad-container flex items-center justify-center ${className} ${wrapperClassName}`}
      style={{ minHeight: sz.h, minWidth: sz.w }}
      aria-label={`Advertisement (${sz.label})`}
    >
      <ins
        ref={ref}
        data-width={sz.w}
        data-height={sz.h}
        style={{
          display: 'inline-block',
          width: sz.w,
          height: sz.h,
          maxWidth: '100%',
        }}
      />
    </div>
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

// Insert a native ad every N items in a grid
export function AdInserter({ every = 12, index }: { every: number; index: number }) {
  if (index === 0) return null;
  if (index % every !== 0) return null;
  return (
    <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 flex justify-center py-4">
      <Ad zone="native" />
    </div>
  );
}
