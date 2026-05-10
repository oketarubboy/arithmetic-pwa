# 計算チャレンジPWA 全iPad共通ランキング設定手順

## 目的

Googleスプレッドシートをランキング保存先にして、複数台のiPadから同じTop5ランキングを表示します。

構成:

```text
iPadのPWA
↓ スコア送信
Google Apps Script
↓ 保存
Googleスプレッドシート
↓ Top5取得
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
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw_Sn5_nHYpD8GE9uIHjAHWUh0g2HzWlP6BOK3j7qQA1rWOcBxWNR5rZXYgjNh2l5r2TA/exec";
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

## 8. スタンプ画像を追加・差し替えする方法

この版では、累計正解数に応じてスタンプ画像を取得できます。
スタンプ枠は40個あり、設定は `stamps/stamps.js` にまとめています。

### ファイル名ルール

画像ファイル名は、必要正解数と同じ数字にしてください。

例:

```text
累計150問正解 → stamps/150.png
累計400問正解 → stamps/400.png
```

### 画像を差し替える場合

1. 差し替えたい画像を `stamps/` フォルダに入れる

例:

```text
stamps/150.png
```

2. `stamps/stamps.js` の該当設定を確認する

```javascript
{
  id: "correct-150",
  name: "イルカ",
  requiredCorrect: 150,
  src: "stamps/150.png",
  description: "累計150問正解で取得"
}
```

3. `service-worker.js` のキャッシュ名を変更する

例:

```javascript
const CACHE_NAME = "arithmetic-pwa-v17";
```

4. GitHub Pagesへ以下を上書きアップロードする

```text
index.html
style.css
app.js
manifest.json
service-worker.js
stamps/
icons/
```


## v17の変更点

- 問題数は10問固定です。設定画面の問題数入力欄はありません。
- プレイヤー名の横に、取得済みスタンプをセットする欄を追加しました。
- ランキングはTop5表示に変更しました。
- ランキングに、プレイ時にセットしていたスタンプを表示するようにしました。
- スタンプ条件は累計正解数10問〜400問まで、10問刻みの40個です。
- スタンプ画像はZIP内に含めていません。`stamps` フォルダに `10.png` 〜 `400.png` を追加してください。
