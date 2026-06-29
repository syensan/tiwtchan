'use client';

import { useState } from 'react';
import { Locale, LOCALES, LOCALE_NAMES, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface Props {
  locale: Locale;
  onChangeLocale: (l: Locale) => void;
}

export default function AdminPanel({ locale, onChangeLocale }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [loginErr, setLoginErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  // Single add
  const [sUrl, setSUrl] = useState('');
  const [sTitle, setSTitle] = useState('');
  const [sThumb, setSThumb] = useState('');
  const [sVideo, setSVideo] = useState('');

  // Bulk
  const [bulkText, setBulkText] = useState('');

  // Scrape
  const [scrapePages, setScrapePages] = useState('3');

  const login = async () => {
    setBusy(true);
    setLoginErr(false);
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) {
        setLoginErr(true);
        toast({ title: t(locale, 'invalidPassword'), variant: 'destructive' });
        return;
      }
      const j = await r.json();
      setToken(j.token);
      toast({ title: t(locale, 'loginSuccess') });
      setPw('');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin', { method: 'DELETE' });
    setToken(null);
  };

  const addSingle = async () => {
    if (!sUrl) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: sUrl, title: sTitle, thumbnail: sThumb, videoUrl: sVideo }),
      });
      const j = await r.json();
      if (j.ok) {
        toast({ title: t(locale, 'added') });
        setSUrl(''); setSTitle(''); setSThumb(''); setSVideo('');
      } else {
        toast({ title: j.error || t(locale, 'error'), variant: 'destructive' });
      }
    } finally {
      setBusy(false);
    }
  };

  const addBulk = async () => {
    if (!bulkText.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls: bulkText }),
      });
      const j = await r.json();
      if (j.ok) {
        toast({ title: `${t(locale, 'added')}: ${j.added} / ${j.failed}` });
        setBulkText('');
      } else {
        toast({ title: j.error || t(locale, 'error'), variant: 'destructive' });
      }
    } finally {
      setBusy(false);
    }
  };

  const runScrape = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pages: parseInt(scrapePages || '3', 10) }),
      });
      const j = await r.json();
      if (j.ok) {
        toast({ title: `${t(locale, 'scraped')}: +${j.added} / scanned ${j.scanned}` });
      } else {
        toast({ title: j.error || t(locale, 'error'), variant: 'destructive' });
      }
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear ALL media?')) return;
    setBusy(true);
    try {
      await fetch('/api/media', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast({ title: t(locale, 'deleted') });
    } finally {
      setBusy(false);
    }
  };

  const deleteOne = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/media?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: t(locale, 'deleted') });
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">{t(locale, 'admin_login')}</h2>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder={t(locale, 'admin_password')}
            className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm mb-3"
            autoFocus
          />
          {loginErr && <p className="text-xs text-red-600 mb-2">{t(locale, 'invalidPassword')}</p>}
          <button
            onClick={login}
            disabled={busy || !pw}
            className="w-full bg-neutral-900 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {busy ? '...' : t(locale, 'admin_login')}
          </button>
          <div className="mt-4 border-t pt-4">
            <label className="block text-xs text-neutral-500 mb-1">{t(locale, 'language')}</label>
            <select
              value={locale}
              onChange={(e) => onChangeLocale(e.target.value as Locale)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            >
              {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t(locale, 'admin_title')}</h2>
        <button onClick={logout} className="text-sm text-neutral-600 hover:text-neutral-900 underline">
          {t(locale, 'admin_logout')}
        </button>
      </div>

      {/* Scrape section */}
      <section className="bg-white border border-neutral-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2">{t(locale, 'admin_scrape')}</h3>
        <p className="text-xs text-neutral-500 mb-3">{t(locale, 'admin_scrapeHint')}</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={10}
            value={scrapePages}
            onChange={(e) => setScrapePages(e.target.value)}
            className="w-20 bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={runScrape}
            disabled={busy}
            className="flex-1 bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {busy ? '...' : t(locale, 'admin_scrape')}
          </button>
        </div>
      </section>

      {/* Bulk add */}
      <section className="bg-white border border-neutral-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2">{t(locale, 'admin_addBulk')}</h3>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={6}
          placeholder={t(locale, 'admin_bulkPlaceholder')}
          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono"
        />
        <button
          onClick={addBulk}
          disabled={busy || !bulkText.trim()}
          className="mt-2 w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {busy ? '...' : t(locale, 'admin_submit')}
        </button>
      </section>

      {/* Single add */}
      <section className="bg-white border border-neutral-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2">{t(locale, 'admin_addSingle')}</h3>
        <div className="space-y-2">
          <input value={sUrl} onChange={(e) => setSUrl(e.target.value)} placeholder={t(locale, 'admin_url')} className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
          <input value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder={t(locale, 'admin_title_label')} className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
          <input value={sThumb} onChange={(e) => setSThumb(e.target.value)} placeholder={t(locale, 'admin_thumbnail')} className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
          <input value={sVideo} onChange={(e) => setSVideo(e.target.value)} placeholder={t(locale, 'admin_videoUrl')} className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
          <button
            onClick={addSingle}
            disabled={busy || !sUrl}
            className="w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {busy ? '...' : t(locale, 'admin_submit')}
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white border border-red-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-red-700 mb-2">⚠ {t(locale, 'admin_clearAll')}</h3>
        <button
          onClick={clearAll}
          disabled={busy}
          className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {t(locale, 'admin_clearAll')}
        </button>
      </section>
    </div>
  );
}
