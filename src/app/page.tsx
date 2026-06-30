'use client';

import { useCallback, useEffect, useState } from 'react';
import { Locale, LOCALES, LOCALE_NAMES, RTL_LOCALES, t } from '@/lib/i18n';
import AgeGate from '@/components/AgeGate';
import Header from '@/components/Header';
import MediaCard, { type MediaItem } from '@/components/MediaCard';
import VideoPlayer from '@/components/VideoPlayer';
import About from '@/components/About';
import Policy from '@/components/Policy';
import { Ad, ResponsiveBanner, AdInserter } from '@/components/Ads';
import { useVisitor } from '@/hooks/use-visitor';

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
  const visitor = useVisitor();

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

  // Helper: build headers with visitor token
  const apiHeaders = useCallback((extra: Record<string, string> = {}) => {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (visitor?.token) h['X-Visitor-Token'] = visitor.token;
    return h;
  }, [visitor]);

  // Fetch media
  const fetchPage = useCallback(async (p: number, append: boolean, q: string) => {
    setLoading(true);
    try {
      const url = `/api/media?page=${p}&pageSize=15${q ? `&q=${encodeURIComponent(q)}` : ''}`;
      const r = await fetch(url, { headers: apiHeaders() });
      const j = await r.json();
      setItems((prev) => (append ? [...prev, ...(j.items || [])] : (j.items || [])));
      setPage_(j.page || 1);
      setTotalPages(j.pages || 1);
      setTotal(j.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

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
    fetch('/api/click', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ id: it.id }),
    }).catch(() => {});
  }, [apiHeaders]);

  // Read URL ?m= or ?p=
  useEffect(() => {
    if (!ageOk) return;
    const u = new URL(window.location.href);
    const p = u.searchParams.get('p');
    const m = u.searchParams.get('m');
    if (p === 'about') setPage('about');
    else if (p === 'policy') setPage('policy');
    if (m) {
      fetch('/api/media?q=' + encodeURIComponent(m), { headers: apiHeaders() })
        .then((r) => r.json())
        .then((j) => {
          const found = (j.items || []).find((x: MediaItem) => x.id === m);
          if (found) setCurrent(found);
        })
        .catch(() => {});
    }
  }, [ageOk, apiHeaders]);

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
                  {/* Insert native ad every 12 items */}
                  {((i + 1) % 12 === 0) && (
                    <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 flex justify-center py-2">
                      <Ad zone="native" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mid-page banner after every page of items */}
            <div className="my-6 flex justify-center">
              <ResponsiveBanner />
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
          {/* Bottom banner */}
          <div className="mb-4 flex justify-center">
            <ResponsiveBanner />
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
