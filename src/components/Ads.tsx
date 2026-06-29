'use client';

import { useEffect, useRef } from 'react';

// JuicyAds zone IDs
// 1119950: Float (mobile float)
// 1119951: 300x100 Mobile
// 1119952: 474x190 Native Responsive
// 1119953: 308x286 Video
export const AD_ZONES = {
  float: 1119950,
  mobileBanner: 1119951,
  nativeResponsive: 1119952,
  video: 1119953,
};

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
  // Also load float
  const f = document.createElement('script');
  f.innerHTML = `juicy_adzone = '${AD_ZONES.float}';`;
  document.head.appendChild(f);
  const f2 = document.createElement('script');
  f2.src = 'https://poweredby.jads.co/js/jfc.js';
  f2.async = true;
  document.head.appendChild(f2);
  jadsLoaded = true;
}

interface AdProps {
  zone: keyof typeof AD_ZONES;
  className?: string;
}

export function Ad({ zone, className = '' }: AdProps) {
  const ref = useRef<HTMLInsElement>(null);
  const zoneId = AD_ZONES[zone];

  useEffect(() => {
    ensureJads();
    // Push ad
    const id = `ad-${zone}-${Math.random().toString(36).slice(2, 8)}`;
    if (ref.current) ref.current.id = id;
    try {
      (window as any).adsbyjuicy = (window as any).adsbyjuicy || [];
      (window as any).adsbyjuicy.push({ adzone: zoneId });
    } catch {}
  }, [zoneId]);

  // Sizing per zone
  const sizes: Record<keyof typeof AD_ZONES, { w: number; h: number }> = {
    float: { w: 0, h: 0 }, // float is auto-injected, hidden here
    mobileBanner: { w: 300, h: 100 },
    nativeResponsive: { w: 474, h: 190 },
    video: { w: 308, h: 286 },
  };
  const sz = sizes[zone];
  if (zone === 'float') return null;

  return (
    <div className={`ad-container my-4 flex items-center justify-center ${className}`}>
      <ins
        ref={ref}
        data-width={sz.w}
        data-height={sz.h}
        style={{ display: 'inline-block', width: sz.w, height: sz.h, maxWidth: '100%' }}
      />
    </div>
  );
}

// Insert native responsive ad every N items
export function AdInserter({ every = 15, index }: { every: number; index: number }) {
  if (index === 0) return null;
  if (index % every !== 0) return null;
  return <Ad zone="nativeResponsive" />;
}
