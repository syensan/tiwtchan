'use client';

import { useState } from 'react';
import { Locale, t } from '@/lib/i18n';

export interface MediaItem {
  id: string;
  title: string;
  thumbnail?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
  sourceUrl?: string | null;
  duration?: string | null;
  views?: number;
  category?: string | null;
}

interface Props {
  item: MediaItem;
  locale: Locale;
  onWatch: (item: MediaItem) => void;
}

export default function MediaCard({ item, locale, onWatch }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="media-card bg-white border border-neutral-200 rounded-xl overflow-hidden cursor-pointer flex flex-col"
      onClick={() => onWatch(item)}
    >
      <div className="relative aspect-video bg-neutral-100 overflow-hidden">
        {item.thumbnail && !imgError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
            <span>{t(locale, 'watch')}</span>
          </div>
        )}
        {item.duration && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            {item.duration}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-900 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 mb-1.5">{item.title}</h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[11px] text-neutral-500">{item.views || 0} views</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatch(item);
            }}
            className="text-[11px] font-medium text-neutral-900 hover:underline"
          >
            {t(locale, 'watch')} →
          </button>
        </div>
      </div>
    </article>
  );
}
