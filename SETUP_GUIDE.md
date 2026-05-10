# 計算チャレンジPWA 全iPad共通ランキング設定手順

## 目的

Googleスプレッドシートをランキング保存先にして、複数台のiPadから同じTop10ランキングを表示します。

構成:

```text
iPadのPWA
↓ スコア送信
Google Apps Script
↓ 保存
Googleスプレッドシート
↓ Top10取得
iPadのPWA
```

## 1. Googleスプレッドシートを作成する

1. Googleドライブを開く
2. 新規 → Googleスプレッドシート
3. ファイル名を `計算チャレンジランキング` などに変更

シート名は自動で `Ranking` が作成されるため、手動で列を作る必要はありません。

## 2. Apps Scriptを作成する

1. スプレッドシート上部の `拡張機能`
2. `Apps Script`
3. `Code.gs` の中身を、このZIP内の `google-apps-script/Code.gs` に置き換える
4. 保存

## 3. Webアプリとしてデプロイする

1. Apps Script画面右上の `デプロイ`
2. `新しいデプロイ`
3. 種類の選択で `ウェブアプリ`
4. 設定を以下にする

```text
説明: ranking-api-v1
実行するユーザー: 自分
アクセスできるユーザー: 全員
```

5. `デプロイ`
6. 初回は権限の承認を行う
7. 表示された `ウェブアプリURL` をコピーする

URL例:

```text
https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
```

## 4. PWA側にURLを設定する

`app.js` のこの部分を探します。

```javascript
const GAS_WEB_APP_URL = "";
```

コピーしたWebアプリURLを貼り付けます。

```javascript
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec";
```

## 5. GitHub Pagesへアップロードする

以下のファイルをGitHub Pagesのリポジトリにアップロードします。

```text
index.html
style.css
app.js
manifest.json
service-worker.js
icons/
```

`google-apps-script/` と `SETUP_GUIDE.md` は説明用なので、GitHub Pagesにアップロードしなくても動きます。

## 6. iPadで更新する

1. iPadのSafariでGitHub PagesのURLを開く
2. 画面を更新
3. ホーム画面のPWAを閉じて開き直す
4. 反映されない場合は、PWAアイコン削除 → SafariのWebサイトデータ削除 → ホーム画面に追加し直す

## 7. 動作確認

1. iPad Aでプレイ
2. 結果画面でスコア送信
3. iPad Bでランキングの `更新` ボタンを押す
4. iPad Aのスコアが表示されれば成功

## 注意点

- オフライン中は端末内ランキングが表示されます。
- オフライン中に出したスコアは端末内に一時保存され、オンライン復帰後に自動送信されます。
- GitHub Pagesに置いたJavaScriptは利用者から見えるため、完全な不正対策はできません。
- 身内で遊ぶランキング用途には十分です。
- 本格的な不正対策が必要な場合は、Firebase Authenticationやサーバー側での署名検証が必要です。

## 8. スタンプ画像を追加する方法

この版では、プレイ回数に応じてスタンプ画像を取得できます。
スタンプ設定は `stamps/stamps.js` にまとめています。

### 追加手順

1. 追加したい画像を `stamps/` フォルダに入れる

例:

```text
stamps/stamp_30.png
```

2. `stamps/stamps.js` に設定を追加する

例:

```javascript
{
  id: "play-30",
  name: "30回達成",
  requiredPlays: 30,
  src: "stamps/stamp_30.png",
  description: "30回プレイで取得"
}
```

既存の配列の最後に追加する場合は、1つ前の項目の末尾に `,` を付けてから追加してください。

3. `service-worker.js` の `ASSETS` に画像パスを追加する

```javascript
"./stamps/stamp_30.png"
```

4. `service-worker.js` のキャッシュ名を変更する

例:

```javascript
const CACHE_NAME = "arithmetic-pwa-v8";
```

5. GitHub Pagesへ以下を上書きアップロードする

```text
index.html
style.css
app.js
manifest.json
service-worker.js
icons/
stamps/
```

6. iPad側で更新する

Safariで以下のように `?v=8` を付けて開いてから、PWAを開き直します。

```text
https://ユーザー名.github.io/arithmetic-pwa/?v=8
```

反映されない場合は、ホーム画面のPWAを削除し、SafariのWebサイトデータを削除してからホーム画面へ追加し直してください。
