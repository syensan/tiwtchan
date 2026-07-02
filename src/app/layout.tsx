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
    "Twitter保存ランキング", "Twitter保存ランキング24", "Twitter保存ランキング消えた",
    "Twitter保存ランキング最新", "Twitter保存ランキングリアルタイム", "Twitter保存ランキングまとめ",
    "Twitter保存ランキング見方", "ななにー流行動画 twitter保存ランキング", "Twitter保存ランキングえ",
    "Twitter保存ランキング100", "Twitter 保存ランキング急", "Twitter保存ランキングどこ",
    "Twitter保存ランキング1週間", "Twitter保存ランキングサイト", "Twitter保存ランキング24時間動画",
    "Twitter保存ランキングやばい", "Twitter保存ランキング動画", "Twitter保存ランキング検索",
    "Twitter保存ランキングとは", "Twitter保存ランキングおすすめ", "Twitter保存ランキング3日間",
    "Twitter 保存ランキング知", "Twitter保存ランキング2025", "Twitter保存ランキング ななにー",
    "Twitter保存ランキング過去", "Twitter保存ランキング24時間前", "Twitter保存ランキングまとめサイト",
    "Twitter保存ランキング検索可能", "Twitter保存ランキング3日", "Twitter保存ランキング見れない",
    "Twitter保存ランキング気", "Twitter保存ランキング2024", "Twitter保存ランキング3",
    "Twitter保存ランキングリアル", "Twitter保存リアルタイム",
    "ツイッター保存ランキング", "ツイッター保存リアルタイム",
    // GoFile系
    "gofileランキング", "gofile ダウンロードランキング", "gofile 保存ランキング",
    "gofile リアルタイムランキング", "gofileランキング リアルタイム", "gofile io ランキング",
    "gofile ランキング 代わり", "gofileランキング 知恵袋", "gofileランキング 見方",
    "gofile ランキング ダウンロード", "gofileランキング エラー", "gofile ダウンローダー の ランキング",
    "gofile ランキング 使い方", "gofile lab ランキング", "gofile の リアルタイム ランキング",
    "gofile video twimg 動画の人気ランキング", "gofileのランキング", "gofile ランキング 消えた",
    "ランキング gofile io", "gofile 人気ランキング", "gofile ランキング と は",
    "gofileランキング見れない", "gofile 知恵袋 ランキング", "gofile ランキングサイト",
    "ランキングgofile", "gofile の 新しい ランキング", "ダウンロード ランキング gofile",
    "gofile ランキング 安全", "gofile io d ランキング", "gofile まとめ ランキング",
    "gofile.me ランキング", "gofiles ランキング", "gofile 動画ランキング",
    "gofile download ランキング",
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

// FAQPage structured data — targets long-tail queries
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Twitter保存ランキングの見方を教えてください",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comのホームページで「Twitter保存ランキング」の動画一覧を確認できます。各動画カードをクリックすると再生、ダウンロードボタンで保存可能です。ページ下部の「次へ」ボタンで過去ランキング（24時間前・3日間・1週間など）も閲覧できます。検索ボックスでタイトル検索も可能です。",
      },
    },
    {
      "@type": "Question",
      name: "Twitter保存ランキング24（24時間ランキング）はどこで見られますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comのホームページが24時間のTwitter保存ランキングに相当します。最新の保存動画が上位に表示され、「次へ」ボタンで過去24時間前・3日間・1週間のランキングまで遡って確認できます。まとめサイトとしても機能します。",
      },
    },
    {
      "@type": "Question",
      name: "Twitter保存ランキングが消えた・見れない場合の対処法は",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Twitter保存ランキングが見れない・消えた場合は、twitchan.comを代替としてご利用ください。当サイトは独自にランキングを集計しており、Twitter本体の仕様変更の影響を受けません。ページを再読み込みするか、別のブラウザでお試しください。",
      },
    },
    {
      "@type": "Question",
      name: "Twitter保存ランキングのリアルタイム更新はありますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、twitchan.comではTwitter保存ランキングのリアルタイム更新に対応しています。最新の保存動画は常にリストの上位に表示され、「次へ」ボタンでページ送りしながら過去のランキングも遡って確認できます。ななにー流行動画などもリアルタイムで捕捉しています。",
      },
    },
    {
      "@type": "Question",
      name: "Twitter保存ランキングとは何ですか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Twitter保存ランキングとは、Twitter（X）でユーザーに多く保存された動画の人気ランキングです。twitchan.comでは成人向けのTwitter保存動画ランキングを24時間・3日間・1週間など複数の期間で集計し、サイト内で直接再生・ダウンロードできます。",
      },
    },
    {
      "@type": "Question",
      name: "GoFile保存ランキングとは何ですか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GoFile保存ランキングは、GoFile（gofile.io / gofile.me）にアップロードされた成人向け動画の人気ランキングです。twitchan.comではTwitter保存ランキングとGoFile保存ランキングを一括して検索・閲覧でき、リアルタイム更新にも対応しています。",
      },
    },
    {
      "@type": "Question",
      name: "GoFileの代わりとなるサービスはありますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comはGoFileの代わりとして利用できます。GoFileと同等の動画をサイト内で直接再生・ダウンロード可能で、追加のアカウント登録や外部アプリ不要でご利用いただけます。GoFile本体がエラーで見れない場合も、当サイトで代替視聴できます。",
      },
    },
    {
      "@type": "Question",
      name: "GoFileの見方・使い方を教えてください",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comではGoFileの見方として、ホームページの動画カードをクリックするだけで内蔵プレイヤーで再生されます。ダウンロードボタンからMP4形式で保存できます。検索ボックスでタイトル検索も可能です。GoFileランキングの使い方も同様で、ランキング上位の動画をワンクリックで視聴できます。",
      },
    },
    {
      "@type": "Question",
      name: "GoFileランキングが消えた・見れない場合の対処法は",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GoFileランキングが消えた・見れない場合、twitchan.comを代替としてご利用ください。当サイトはGoFileの新しいランキングを独自に集計しており、GoFile本体の障害の影響を受けません。GoFileランキングがエラーで開かない場合も、当サイトで安全に視聴できます。",
      },
    },
    {
      "@type": "Question",
      name: "GoFileランキングの安全な使い方は",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comはGoFileランキングを安全に閲覧できるサイトです。広告は当サイト管理のJuicyAdsのみで、ソースサイトの不審なスクリプトは読み込みません。匿名訪問者暗号化によりIPアドレスも保護されます。GoFileランキングのまとめサイトとしてもご利用いただけます。",
      },
    },
    {
      "@type": "Question",
      name: "ななにー流行動画のTwitter保存ランキングは見られますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、twitchan.comではななにー流行動画など、Twitterで保存された流行動画をランキング形式で掲載しています。ホームページの動画一覧がリアルタイムの保存ランキングに相当し、検索ボックスで「ななにー」などで絞り込み検索も可能です。",
      },
    },
    {
      "@type": "Question",
      name: "Twitter保存ランキングのおすすめ動画はどこで探せますか",
      acceptedAnswer: {
        "@type": "Answer",
        text: "twitchan.comのホームページに表示される上位動画が、Twitter保存ランキングのおすすめ動画です。最新の保存数が多い動画ほど上位に表示されます。検索ボックスでキーワード検索すれば、特定のジャンルのおすすめ動画も探せます。",
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

        {/* JuicyAds Standard PopUnder v3 — most aggressive/high-earning.
            Placed in BODY (not HEAD) per official docs. */}
        <Script
          src="https://js.juicyads.com/jp.php?c=44640323y274u4r2p2b4x2c434&u=https%3A%2F%2Fwww.juicyads.rocks"
          strategy="afterInteractive"
        />

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
