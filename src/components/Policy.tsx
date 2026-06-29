'use client';

import { Locale, t } from '@/lib/i18n';

export default function Policy({ locale }: { locale: Locale }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t(locale, 'policy_title')}</h1>
      <div className="prose prose-sm text-neutral-700 space-y-6">
        <section>
          <h2 className="text-base font-semibold text-neutral-900">1. Age Requirement</h2>
          <p>
            This website is intended exclusively for users who are at least 18 years of age (or the age of majority in their jurisdiction).
            By entering, you confirm that you meet this requirement and that adult content is legal where you reside.
            The site is labeled with the RTA (Restricted to Adults) metadata and uses an age gate on first visit.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-neutral-900">2. Content Source & Ownership</h2>
          <p>
            All videos, thumbnails, and metadata displayed on twitchan.com are sourced from third-party providers and embedded via their public URLs.
            We do not host, store, or cache any media files on our servers. All trademarks, copyrights, and other intellectual property rights
            belong to their respective owners. We are not responsible for the content provided by third parties.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-neutral-900">3. Privacy</h2>
          <p>
            We do not use tracking cookies. Two cookies are set: a session cookie for admin authentication (httpOnly, 12-hour expiration)
            and a visitor token cookie (httpOnly, 30-day expiration) used for anonymous view deduplication.
            IP addresses are used solely for automatic locale detection (language guessing based on country) and are not stored long-term.
            We do not sell or share any user data with third parties. No analytics scripts are loaded.
          </p>
          <p className="mt-2">
            <strong>Anonymous visitor encryption.</strong> Each visitor is assigned a random 128-bit ID generated client-side
            (using <code>crypto.getRandomValues</code>) and stored only in your browser's localStorage. This ID is sent to our server
            and signed with HMAC-SHA256 using a server-side secret, producing an opaque token. Only the SHA-256 hash of your visitor ID
            is ever stored on the server (for view deduplication) — the raw ID never leaves your browser unencrypted.
            No personally identifiable information (name, email, IP) is collected or stored.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-neutral-900">4. Advertising</h2>
          <p>
            This site displays third-party advertisements (JuicyAds). Advertisers may use cookies as part of their service;
            please refer to the respective advertiser's privacy policy for details. Advertisements are clearly marked as "Sponsored".
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-neutral-900">5. Takedown / DMCA</h2>
          <p>
            If you believe any content linked from this site infringes your copyright, please contact the original hosting provider directly.
            We will also remove any listing from our index upon receiving a valid takedown request — include the listing URL and proof of ownership.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-neutral-900">6. Acceptable Use</h2>
          <p>
            You agree not to use this site for any unlawful purpose, including but not limited to attempting to bypass age verification,
            scraping content at excessive rates, or attempting to compromise site security. Automated access for indexing is permitted
            at reasonable rates.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-neutral-900">7. Disclaimer</h2>
          <p>
            The site is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the site
            or from content linked to or displayed on the site. Use at your own discretion.
          </p>
        </section>
      </div>
    </div>
  );
}
