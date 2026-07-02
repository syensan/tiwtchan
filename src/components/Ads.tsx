'use client';

import { useEffect, useState } from 'react';

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

interface AdProps {
  zone: AdZone;
  className?: string;
}

// Render JuicyAds via direct iframe to adshow.php.
export function Ad({ zone, className = '' }: AdProps) {
  const zoneId = AD_ZONES[zone];
  const sz = ZONE_SIZES[zone];
  return (
    <div
      className={`ad-container flex items-center justify-center ${className}`}
      style={{ width: sz.w, height: sz.h, maxWidth: '100%' }}
      aria-label={`Advertisement (${sz.label} ${sz.w}x${sz.h})`}
    >
      <iframe
        src={`https://poweredby.jads.co/adshow.php?adzone=${zoneId}`}
        title={`Ad ${sz.label}`}
        width={sz.w}
        height={sz.h}
        style={{ border: 0, display: 'block', maxWidth: '100%' }}
        scrolling="no"
        marginWidth={0}
        marginHeight={0}
        allowFullScreen
      />
    </div>
  );
}

// Conditional desktop / mobile banner
export function ResponsiveBanner({ className = '' }: { className?: string }) {
  const [device] = useState<'pc' | 'mobile'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'pc';
    }
    return 'pc';
  });
  return <Ad zone={device === 'mobile' ? 'mobileBanner' : 'pcBanner'} className={className} />;
}

// JuicyAds PopUnder Direct URL
const POPUNDER_URL = 'https://xapi.juicyads.com/service_advanced.php?code=4454v2c423845684t2133484r2&u=https%3A%2F%2Fwww.juicyads.rocks';

// Fire a single popunder window. Can be called from anywhere (e.g. download button).
// Tracks total fires per session to avoid spamming — max 5 per session.
let totalFired = 0;
const MAX_TOTAL = 5;
export function firePopUnder() {
  if (totalFired >= MAX_TOTAL) return;
  totalFired++;
  try {
    const w = window.open(POPUNDER_URL, '_blank', 'noopener,noreferrer,width=1024,height=768');
    if (w) {
      w.blur();
      window.focus();
    }
  } catch {
    /* popup blocked — ignore */
  }
}

let popunderLoaded = false;
export function PopUnder() {
  useEffect(() => {
    if (popunderLoaded) return;
    popunderLoaded = true;

    // 1. Load the JuicyAds advanced service script (handles popunder logic)
    const s = document.createElement('script');
    s.src = POPUNDER_URL;
    s.async = true;
    s.type = 'text/javascript';
    document.body.appendChild(s);

    // 2. Fire two popunder windows on the first two user interactions (clicks).
    //    These share the global totalFired counter with firePopUnder() so the
    //    total across all triggers (entry clicks + video play + download) stays
    //    capped at MAX_TOTAL per session.
    const MAX_CLICK = 2;
    let clickFired = 0;
    const firePop = () => {
      if (clickFired >= MAX_CLICK) return;
      clickFired++;
      firePopUnder();
      if (clickFired >= MAX_CLICK) {
        document.removeEventListener('click', firePop, true);
        document.removeEventListener('touchstart', firePop, true);
      }
    };
    document.addEventListener('click', firePop, true);
    document.addEventListener('touchstart', firePop, true);

    return () => {
      document.removeEventListener('click', firePop, true);
      document.removeEventListener('touchstart', firePop, true);
    };
  }, []);
  return null;
}
