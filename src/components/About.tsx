'use client';

import { Locale, t } from '@/lib/i18n';

export default function About({ locale }: { locale: Locale }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t(locale, 'about_title')}</h1>
      <div className="prose prose-sm text-neutral-700 space-y-4">
        <p>
          twitchan.comは、<strong>Twitter保存ランキング</strong>・<strong>GoFile保存ランキング</strong>・<strong>Twitter保存リアルタイム</strong>・<strong>GoFileリアルタイム</strong>を一括検索できる軽量・多言語対応のアダルト動画ギャラリーです。
          GoFileの代わりとして、またTwitter保存ランキングの見方を解説するプラットフォームとして、高速で邪魔にならない浏览体験とサイト内再生・ワンクリックダウンロードを提供します。
        </p>
        <p>
          当サイトは軽量設計です — 重いフレームワークなし、トラッキングなし、侵入的なポップアップなし。プライバシーと通信量を尊重します。
          すべてのUIテキストはIPジオロケーションに基づいて自動翻訳され、ヘッダーからいつでも手動で言語切替可能です（18言語対応）。
        </p>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Twitter保存ランキングの見方</h2>
          <p>
            ホームページに表示される動画カード一覧が「Twitter保存ランキング」です。各カードをクリックすると内蔵プレイヤーで再生されます。
            ページ下部の「次へ」ボタンで過去のランキング（24時間前・3日間・1週間など）を遡って確認できます。検索ボックスでタイトル検索も可能で、Twitter保存ランキング検索としても機能します。
            リアルタイム更新にも対応しており、最新の保存動画は常にリスト上位に表示されます。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Twitter保存ランキング24（24時間ランキング）</h2>
          <p>
            ホームページの上位動画が直近24時間のTwitter保存ランキングに相当します。
            <strong>Twitter保存ランキング24時間動画</strong>・<strong>Twitter保存ランキング100</strong>・<strong>Twitter保存ランキング1週間</strong>など、
            様々な期間のランキングを「次へ」ボタンで辿れます。<strong>Twitter保存ランキングまとめサイト</strong>としてもご利用いただけます。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Twitter保存ランキングが消えた・見れない場合</h2>
          <p>
            公式のTwitter保存ランキングが消えた・見れない場合、twitchan.comを代替としてご利用ください。
            当サイトは独自にランキングを集計しており、Twitter本体の仕様変更の影響を受けません。
            <strong>Twitter保存ランキング2025</strong>・<strong>Twitter保存ランキング2024</strong>の過去ランキングも閲覧可能です。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">ななにー流行動画のTwitter保存ランキング</h2>
          <p>
            ななにー流行動画など、Twitterで保存された流行動画もランキング形式で掲載しています。
            検索ボックスで「ななにー」と入力すれば絞り込み検索可能です。
            <strong>Twitter保存ランキングおすすめ</strong>動画としてもご活用いただけます。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">GoFile保存ランキングとは</h2>
          <p>
            <strong>GoFile保存ランキング</strong>（gofile 保存ランキング）は、GoFile（gofile.io / gofile.me）にアップロードされた成人向け動画の人気ランキングです。
            twitchan.comではTwitter保存ランキングとGoFile保存ランキングを一括して検索・閲覧でき、リアルタイム更新にも対応しています。
            GoFile本体にアクセスすることなく、サイト内で直接再生・ダウンロードが可能です。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">GoFileランキングの使い方・見方</h2>
          <p>
            <strong>gofileランキング 見方</strong>・<strong>gofile ランキング 使い方</strong>について：
            ホームページの動画カードをクリックするだけで内蔵プレイヤーで再生されます。
            ダウンロードボタンからMP4形式で保存できます（<strong>gofile ランキング ダウンロード</strong>機能）。
            検索ボックスでタイトル検索も可能です。<strong>gofile ダウンロードランキング</strong>・<strong>gofile 人気ランキング</strong>としても機能します。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">GoFileの代わりとしての利用</h2>
          <p>
            twitchan.comは<strong>GoFileの代わり</strong>（gofile ランキング 代わり）として利用できます。
            GoFileと同等の動画をサイト内で直接再生・ダウンロード可能で、追加のアカウント登録や外部アプリのインストールは不要です。
            <strong>gofileランキング エラー</strong>・<strong>gofile ランキング 消えた</strong>・<strong>gofileランキング見れない</strong>場合も、
            当サイトで安全に代替視聴できます。<strong>gofile の 新しい ランキング</strong>も随時更新しています。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">GoFileランキングの安全性</h2>
          <p>
            twitchan.comは<strong>gofile ランキング 安全</strong>に閲覧できるサイトです。
            広告は当サイト管理のJuicyAdsのみで、ソースサイトの不審なスクリプトは読み込みません。
            匿名訪問者暗号化によりIPアドレスも保護されます。<strong>gofile まとめ ランキング</strong>サイトとしてもご利用いただけます。
            <strong>gofileランキング 知恵袋</strong>・<strong>gofile 知恵袋 ランキング</strong>で話題の動画も網羅しています。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">コンテンツとプライバシー</h2>
          <p>
            twitchan.comに表示される全コンテンツは第三者プロバイダから取得しており、メディアファイルのホスティング・保存・キャッシュは行っていません。
            再生時はJust-In-Timeプロキシでストリーミングのみを行います。コンテンツ所有者で削除を希望される場合は、ポリシーページのテイクダウン手順をご参照ください。
          </p>
          <p>
            匿名訪問者暗号化により、IPアドレス・UAは保存時にハッシュ化・暗号化され、身元特定できません。
            当サイトの利用により、18歳以上（または居住地の法定年齢）であり、成人コンテンツの閲覧が合法であることを確認したものとみなされます。
            サイトはRTA（Restricted to Adults）ラベル付きで、業界標準の年齢確認を実施しています。
          </p>
        </section>
      </div>
    </div>
  );
}
