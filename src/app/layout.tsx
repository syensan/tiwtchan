import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PopUnder } from "@/components/Ads";

const SITE_URL = 'https://twitchan.com';
const GA_ID = 'G-6HNVZLG0NL';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "twitchan.com — Curated Adult Media Gallery (18+)",
    template: "%s | twitchan.com",
  },
  description:
    "twitchan.com is a lightweight, multilingual adult media gallery. Browse curated videos, watch in-site, download with one click. 18+ only. RTA labeled.",
  keywords: [
    "adult gallery", "18+", "RTA labeled", "video gallery", "twitchan",
    "adult content", "multilingual adult site", "video downloader",
  ],
  applicationName: "twitchan.com",
  authors: [{ name: "twitchan.com" }],
  creator: "twitchan.com",
  publisher: "twitchan.com",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "twitchan.com — Curated Adult Media Gallery (18+)",
    description: "Lightweight, multilingual adult media gallery with in-site player and one-click download. 18+ only.",
    siteName: "twitchan.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "twitchan.com — Curated Adult Media Gallery (18+)",
    description: "Lightweight, multilingual adult media gallery. 18+ only.",
  },
  category: "adult",
  classification: "Adult 18+",
  other: {
    "rating": "adult",
    "RATING": "RTA-5042-1996-1400-1577-RTA",
    "distribution": "global",
    "revisit-after": "1 day",
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/api/manifest",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "twitchan.com",
  url: SITE_URL,
  description: "Curated adult media gallery. 18+ only.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "twitchan.com",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="antialiased bg-white text-neutral-900">
        {children}
        <Toaster />
        <PopUnder />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
        />
      </body>
    </html>
  );
}
