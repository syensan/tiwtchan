'use client';

import { Locale, t } from '@/lib/i18n';

export default function About({ locale }: { locale: Locale }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t(locale, 'about_title')}</h1>
      <div className="prose prose-sm text-neutral-700 space-y-4">
        <p>
          twitchan.com is a lightweight, multilingual adult media gallery that aggregates publicly available video listings from third-party providers.
          Our goal is to provide a fast, distraction-free browsing experience with in-site playback and one-click download.
        </p>
        <p>
          The site is designed to be lightweight: no heavy frameworks, no tracking, no invasive popups. We respect your privacy and your bandwidth.
          All textual UI is auto-translated based on your IP geolocation, with manual language switching available at any time.
        </p>
        <p>
          All content displayed on twitchan.com is sourced from third-party providers and embedded via their public URLs.
          We do not host, store, or transmit any media files on our servers. If you are a content owner and wish to have a listing removed,
          please refer to our Policy page for takedown instructions.
        </p>
        <p>
          By using this site, you confirm that you are at least 18 years of age (or the age of majority in your jurisdiction)
          and that adult content is legal where you live. The site is labeled with RTA (Restricted to Adults) and follows
          industry-standard age-verification practices.
        </p>
      </div>
    </div>
  );
}
