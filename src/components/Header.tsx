'use client';

import { Locale, LOCALES, LOCALE_NAMES, RTL_LOCALES, t } from '@/lib/i18n';

interface Props {
  locale: Locale;
  page: 'home' | 'about' | 'policy';
  onNav: (p: 'home' | 'about' | 'policy') => void;
  onSearch: (q: string) => void;
  search: string;
  onChangeLocale: (l: Locale) => void;
}

export default function Header({ locale, page, onNav, onSearch, search, onChangeLocale }: Props) {
  const isRTL = RTL_LOCALES.includes(locale);
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => onNav('home')}
          className="flex items-center gap-2 shrink-0"
        >
          <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">
            twitchan<span className="text-neutral-400">.com</span>
          </span>
        </button>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {(['home', 'about', 'policy'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onNav(p)}
              className={`px-3 py-1.5 rounded-md transition ${page === p ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {t(locale, `nav_${p}`)}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-md ml-auto">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t(locale, 'searchPlaceholder')}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-neutral-400"
          />
        </div>

        <select
          value={locale}
          onChange={(e) => onChangeLocale(e.target.value as Locale)}
          className="bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-xs sm:text-sm"
          aria-label={t(locale, 'language')}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
          ))}
        </select>
      </div>

      {/* Mobile nav */}
      <nav className="sm:hidden flex items-center gap-1 px-2 pb-2 text-xs">
        {(['home', 'about', 'policy'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onNav(p)}
            className={`px-2.5 py-1 rounded-md transition ${page === p ? 'bg-neutral-900 text-white' : 'text-neutral-600 bg-neutral-100'}`}
          >
            {t(locale, `nav_${p}`)}
          </button>
        ))}
      </nav>
    </header>
  );
}
