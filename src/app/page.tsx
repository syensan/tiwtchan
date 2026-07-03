'use client';

import { useCallback, useEffect, useState } from 'react';
import { Locale, LOCALES, LOCALE_NAMES, RTL_LOCALES, t } from '@/lib/i18n';
import AgeGate from '@/components/AgeGate';
import Header from '@/components/Header';
import MediaCard, { type MediaItem } from '@/components/MediaCard';
import VideoPlayer from '@/components/VideoPlayer';
import About from '@/components/About';
import Policy from '@/components/Policy';
import { Ad, ResponsiveBanner, firePopUnder } from '@/components/Ads';

type Page = 'home' | 'about' | 'policy';
const AGE_KEY = 'twitchan_age_ok_v1';
const LOCALE_KEY = 'twitchan_locale_v1';

export default function Home() {
  const [ageOk, setAgeOk] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const [page, setPage] = useState<Page>('home');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page_, setPage_] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Bootstrap: detect locale via /api/geo (or use saved)
  useEffect(() => {
    const savedAge = typeof window !== 'undefined' && localStorage.getItem(AGE_KEY) === '1';
    const savedLocale = (typeof window !== 'undefined' && localStorage.getItem(LOCALE_KEY)) as Locale | null;
    setAgeOk(savedAge);

    if (savedLocale && LOCALES.includes(savedLocale)) {
      setLocale(savedLocale);
      setInitializing(false);
    } else {
      fetch('/api/geo')
        .then((r) => r.json())
        .then((j) => {
          if (j.locale && LOCALES.includes(j.locale)) setLocale(j.locale);
        })
        .catch(() => {})
        .finally(() => setInitializing(false));
    }
  }, []);

  // Update <html> dir + lang when locale changes
  useEffect(() => {
    const isRTL = RTL_LOCALES.includes(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', isRTL);
  }, [locale]);

  const changeLocale = useCallback((l: Locale) => {
    setLocale(l);
    try { localStorage.setItem(LOCALE_KEY, l); } catch {}
  }, []);

  const enter = useCallback(() => {
    setAgeOk(true);
    try { localStorage.setItem(AGE_KEY, '1'); } catch {}
  }, []);
  const leave = useCallback(() => {
    window.location.href = 'https://www.google.com';
  }, []);

  // Static media cache (loaded once from /api-media.json)
  const [staticMedia, setStaticMedia] = useState<MediaItem[] | null>(null);

  // Load static media JSON once
  useEffect(() => {
    if (staticMedia) return;
    fetch('/api-media.json')
      .then((r) => r.json())
      .then((j) => setStaticMedia(j.items || []))
      .catch(() => setStaticMedia([]));
  }, [staticMedia]);

  // Fetch media (from static cache, no Function call)
  const fetchPage = useCallback(async (p: number, append: boolean, q: string) => {
    if (!staticMedia) return;
    setLoading(true);
    try {
      const pageSize = 15;
      let filtered = staticMedia;
      if (q) {
        const ql = q.toLowerCase();
        filtered = staticMedia.filter((m) =>
          (m.title || '').toLowerCase().includes(ql) ||
          (m.id || '').toLowerCase().includes(ql)
        );
      }
      const total = filtered.length;
      const start = (p - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);
      setItems((prev) => (append ? [...prev, ...pageItems] : pageItems));
      setPage_(p);
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
      setTotal(total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [staticMedia]);

  // Reload when page or search changes (non-append)
  useEffect(() => {
    if (!ageOk || page !== 'home') return;
    fetchPage(1, false, search);
    setPage_(1);
  }, [ageOk, page, search, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || page_ >= totalPages) return;
    // Remember current scroll position as the "top of new content" anchor
    const oldItemCount = items.length;
    fetchPage(page_ + 1, true, search).then(() => {
      // After new items are appended, scroll to show the first new item
      setTimeout(() => {
        const cards = document.querySelectorAll('article');
        if (cards.length > oldItemCount) {
          const firstNewCard = cards[oldItemCount] as HTMLElement;
          if (firstNewCard) {
            firstNewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 200);
    });
  }, [loading, page_, totalPages, fetchPage, search, items.length]);

  const watch = useCallback((it: MediaItem) => {
    setCurrent(it);
    // Skip the /api/click call to reduce Function invocations (cost optimization).
    // View counts are now best-effort via the iframe load itself.
    // Fire a popunder when the user attempts to play a video
    firePopUnder();
  }, []);

  // Read URL ?m= or ?p=
  useEffect(() => {
    if (!ageOk) return;
    const u = new URL(window.location.href);
    const p = u.searchParams.get('p');
    const m = u.searchParams.get('m');
    if (p === 'about') setPage('about');
    else if (p === 'policy') setPage('policy');
    if (m && staticMedia) {
      const found = staticMedia.find((x) => x.id === m);
      if (found) setCurrent(found);
    }
  }, [ageOk, staticMedia]);

  const isRTL = RTL_LOCALES.includes(locale);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!ageOk) {
    return (
      <AgeGate
        locale={locale}
        onEnter={enter}
        onLeave={leave}
        onChangeLocale={changeLocale}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header
        locale={locale}
        page={page}
        onNav={(p) => setPage(p)}
        onSearch={setSearch}
        search={search}
        onChangeLocale={changeLocale}
      />

      {/* Top banner — responsive (468x60 PC / 300x100 mobile) */}
      <div className="border-b border-neutral-200 bg-neutral-50 py-2 flex justify-center">
        <ResponsiveBanner />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4">
        {page === 'home' && (
          <>
            {items.length === 0 && !loading && (
              <div className="text-center py-20 text-neutral-400 text-sm">{t(locale, 'empty')}</div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {items.map((it, i) => (
                <div key={it.id} className="contents">
                  <MediaCard item={it} locale={locale} onWatch={watch} />
                  {/* Insert native ad ONCE after the 12th item */}
                  {i === 11 && (
                    <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 flex justify-center py-2">
                      <Ad zone="native" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination — guaranteed visible, NOT sticky-footer */}
            <div className="flex flex-wrap items-center justify-center gap-3 my-8 select-none">
              <button
                onClick={() => fetchPage(Math.max(1, page_ - 1), false, search)}
                disabled={page_ <= 1 || loading}
                className="px-4 py-2.5 rounded-lg border border-neutral-300 text-sm disabled:opacity-40 hover:bg-neutral-50 transition"
              >
                ← {t(locale, 'prev')}
              </button>
              <span className="text-sm text-neutral-600 px-2">
                {t(locale, 'page')} {page_} {t(locale, 'of')} {totalPages || 1} · {total}
              </span>
              <button
                onClick={loadMore}
                disabled={page_ >= totalPages || loading}
                className="px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm disabled:opacity-40 hover:bg-neutral-800 transition font-medium"
              >
                {loading ? t(locale, 'loading') : t(locale, 'next')} →
              </button>
            </div>
          </>
        )}

        {page === 'about' && <About locale={locale} />}
        {page === 'policy' && <Policy locale={locale} />}
      </main>

      <footer className="mt-auto border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          {/* SEO keyword cloud — long-tail Japanese queries */}
          <div className="mb-3 text-[11px] text-neutral-400 leading-relaxed">
            <span className="text-neutral-500">人気キーワード:</span>{' '}
            Twitter保存ランキング · Twitter保存ランキング24 · Twitter保存ランキング消えた ·{' '}
            Twitter保存ランキング最新 · Twitter保存ランキングリアルタイム · Twitter保存ランキングまとめ ·{' '}
            Twitter保存ランキング見方 · Twitter保存ランキング100 · Twitter保存ランキング1週間 ·{' '}
            Twitter保存ランキング24時間動画 · Twitter保存ランキング検索 · Twitter保存ランキングとは ·{' '}
            Twitter保存ランキングおすすめ · Twitter保存ランキング3日間 · Twitter保存ランキング2025 ·{' '}
            Twitter保存ランキング過去 · Twitter保存ランキングまとめサイト · Twitter保存ランキング見れない ·{' '}
            ななにー流行動画 twitter保存ランキング · ツイッター保存ランキング ·{' '}
            gofileランキング · gofile ダウンロードランキング · gofile 保存ランキング ·{' '}
            gofile リアルタイムランキング · gofileランキング リアルタイム · gofile io ランキング ·{' '}
            gofile ランキング 代わり · gofileランキング 知恵袋 · gofileランキング 見方 ·{' '}
            gofile ランキング ダウンロード · gofileランキング エラー · gofile ランキング 使い方 ·{' '}
            gofile lab ランキング · gofile video twimg 動画の人気ランキング · gofile ランキング 消えた ·{' '}
            gofile 人気ランキング · gofileランキング見れない · gofile 知恵袋 ランキング ·{' '}
            gofile ランキングサイト · gofile の 新しい ランキング · gofile ランキング 安全 ·{' '}
            gofile まとめ ランキング · gofile.me ランキング · gofiles ランキング ·{' '}
            gofile 動画ランキング · gofile download ランキング · GoFile保存ランキング ·{' '}
            GoFileの代わり · GoFile見方 · 保存ランキング · リアルタイムランキング
          </div>
          <p className="text-xs text-neutral-500 mb-2">
            © {new Date().getFullYear()} twitchan.com · {t(locale, 'footerRights')}
          </p>
          <p className="text-[11px] text-neutral-400 mb-2 max-w-2xl mx-auto leading-relaxed">
            {t(locale, 'footerDisclaimer')}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="tag-chip">18+</span>
            <span className="tag-chip">RTA-5042</span>
            <button onClick={() => setPage('about')} className="tag-chip hover:bg-neutral-200">{t(locale, 'nav_about')}</button>
            <button onClick={() => setPage('policy')} className="tag-chip hover:bg-neutral-200">{t(locale, 'nav_policy')}</button>
          </div>
        </div>
      </footer>

      <VideoPlayer item={current} locale={locale} onClose={() => setCurrent(null)} />
    </div>
  );
}
