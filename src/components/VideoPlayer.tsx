'use client';

import { useEffect, useState } from 'react';
import { Locale, t } from '@/lib/i18n';
import type { MediaItem } from './MediaCard';
import { Ad } from './Ads';

interface Props {
  item: MediaItem | null;
  locale: Locale;
  onClose: () => void;
}

export default function VideoPlayer({ item, locale, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

  const handleDownload = async () => {
    try {
      // Hit click counter
      fetch('/api/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
      // Open download endpoint in new tab
      window.open(`/api/download?id=${encodeURIComponent(item.id)}`, '_blank');
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(item.sourceUrl || item.embedUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Determine video source
  const src = item.videoUrl || item.embedUrl || item.sourceUrl;

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900 truncate pr-3">{item.title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"
            aria-label={t(locale, 'closePlayer')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="bg-black aspect-video w-full">
            {src ? (
              <iframe
                src={src}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                {t(locale, 'empty')}
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                {t(locale, 'download')}
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-800 text-sm px-4 py-2 rounded-lg hover:bg-neutral-50 transition"
              >
                {copied ? '✓' : '🔗'} URL
              </button>
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-800 text-sm px-4 py-2 rounded-lg hover:bg-neutral-50 transition"
                >
                  ↗ Source
                </a>
              )}
            </div>
            <p className="text-xs text-neutral-500">{item.views || 0} views · {item.category || 'main'}</p>

            {/* Video ad underneath */}
            <Ad zone="video" className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
