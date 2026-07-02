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
    default: "twitchan.com — Twitter保存ランキング・GoFile保存ランキング・リアルタイム (18+)",
    template: "%s | twitchan.com",
  },
  description:
    "twitchan.comはTwitter保存ランキング、GoFile保存ランキング、Twitter保存リアルタイム、GoFileリアルタイムを一括検索できるアダルト動画ギャラリー。GoFileの代わり・GoFile見方・Twitter保存ランキング見方も解説。18+ only. RTA labeled.",
  keywords: [
    // Twitter保存系
    "Twitter保存ランキング", "Twitter保存リアルタイム", "Twitter保存ランキング見方",
    "ツイッター保存ランキング", "ツイッター保存リアルタイム",
    // GoFile系
    "GoFile保存ランキング", "GoFileリアルタイム", "GoFileの代わり", "GoFile見方",
    "gofile保存ランキング", "gofileリアルタイム", "gofileの代わり", "gofile見方",
    // 一般
    "adult gallery", "18+", "RTA labeled", "video gallery", "twitchan",
    "adult content", "multilingual adult site", "video downloader",
    "保存ランキング", "リアルタイムランキング",
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
    title: "twitchan.com — Twitter保存ランキング・GoFile保存ランキング・リアルタイム (18+)",
    description: "Twitter保存ランキング、GoFile保存ランキング、Twitter保存リアルタイム、GoFileリアルタイムを一括検索。GoFileの代わり・見方も解説。18+ only.",
    siteName: "twitchan.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "twitchan.com — Twitter保存ランキング・GoFile保存ランキング・リアルタイム (18+)",
    description: "Twitter保存ランキング・GoFile保存ランキング・リアルタイム検索。GoFileの代わり・見方も。18+ only.",
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
  alternateName: "Twitter保存ランキング・GoFile保存ランキング",
  url: SITE_URL,
  description: "Twitter保存ランキング、GoFile保存ランキング、Twitter保存リアルタイム、GoFileリアルタイムを一括検索できるアダルト動画ギャラリー。GoFileの代わり・GoFile見方・Twitter保存ランキング見方も解説。18+ only.",
  keywords: "Twitter保存ランキング, GoFile保存ランキング, Twitter保存リアルタイム, GoFileリアルタイム, GoFileの代わり, GoFile見方, Twitter保存ランキング見方",
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

// FAQPage structured data — targets long-tail queries like
// "Twitter保存ランキング見方", "GoFileの代わり", "GoFile見方"
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Twitter保存ランキングの見方を教えてください",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comのホームページで「Twitter保存ランキング」の動画一覧を確認できます。各動画カードをクリックすると再生、ダウンロードボタンで保存可能です。ページ下部の「次へ」ボタンで過去ランキングも閲覧できます。",
      },
    },
    {
      "@type": "Question",
      name: "GoFile保存ランキングとは何ですか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GoFile保存ランキングは、GoFileにアップロードされた成人向け動画の人気ランキングです。twitchan.comではTwitter保存ランキングとGoFile保存ランキングを一括して検索・閲覧でき、リアルタイム更新にも対応しています。",
      },
    },
    {
      "@type": "Question",
      name: "GoFileの代わりとなるサービスはありますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comはGoFileの代わりとして利用できます。GoFileと同等の動画をサイト内で直接再生・ダウンロード可能で、追加のアカウント登録や外部アプリ不要でご利用いただけます。",
      },
    },
    {
      "@type": "Question",
      name: "GoFileの見方・使い方を教えてください",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comではGoFileの見方として、ホームページの動画カードをクリックするだけで内蔵プレイヤーで再生されます。ダウンロードボタンからMP4形式で保存できます。検索ボックスでタイトル検索も可能です。",
      },
    },
    {
      "@type": "Question",
      name: "Twitter保存ランキングのリアルタイム更新はありますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、twitchan.comではTwitter保存ランキングのリアルタイム更新に対応しています。最新の動画は常にリストの上位に表示され、「次へ」ボタンでページ送りしながら過去のランキングも遡って確認できます。",
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
        />
      </body>
    </html>
  );
}
