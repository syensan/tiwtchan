import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// GET /manifest.json — PWA manifest (static, generated at build time)
export async function GET() {
  return NextResponse.json({
    name: 'twitchan.com',
    short_name: 'twitchan',
    description: 'Twitter保存ランキング・GoFile保存ランキング・リアルタイム検索のアダルト動画ギャラリー。18+ only.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
