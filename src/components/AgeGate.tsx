'use client';

import { Locale, LOCALES, LOCALE_NAMES, RTL_LOCALES, t } from '@/lib/i18n';

interface Props {
  locale: Locale;
  onEnter: () => void;
  onLeave: () => void;
  onChangeLocale: (l: Locale) => void;
}

export default function AgeGate({ locale, onEnter, onLeave, onChangeLocale }: Props) {
  const isRTL = RTL_LOCALES.includes(locale);

  return (
    <div
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur flex items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <span className="text-2xl font-bold text-neutral-900">18+</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-neutral-900">{t(locale, 'ageTitle')}</h1>
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">{t(locale, 'ageDesc')}</p>

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={onEnter}
            className="w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 transition"
          >
            {t(locale, 'ageConfirm')}
          </button>
          <button
            onClick={onLeave}
            className="w-full bg-white text-neutral-700 py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 transition"
          >
            {t(locale, 'ageDeny')}
          </button>
        </div>

        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">{t(locale, 'ageWarning')}</p>

        <div className="border-t border-neutral-200 pt-4">
          <label className="block text-xs text-neutral-500 mb-2">{t(locale, 'language')}</label>
          <select
            value={locale}
            onChange={(e) => onChangeLocale(e.target.value as Locale)}
            className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
            ))}
          </select>
          <div className="mt-3 text-[10px] text-neutral-400">
            <span className="tag-chip">RTA-5042-1996-1400-1577-RTA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
