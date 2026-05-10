# スタンプ画像を追加する手順

このアプリでは、スタンプの取得条件を「累計正解数」で判定します。

## 例：累計150問正解で取得できるスタンプを追加する

### 1. 画像ファイルを追加

`stamps` フォルダに画像を追加します。

```text
stamps/stamp_150.png
```

推奨サイズは 512×512px のPNGです。

### 2. `stamps/stamps.js` に設定を追加

```javascript
{
  id: "correct-150",
  name: "150問達成",
  requiredCorrect: 150,
  src: "stamps/stamp_150.png",
  description: "累計150問正解で取得"
}
```

既存の配列の最後に追加する場合は、1つ前の要素の後ろにカンマ`,`を付けてください。

### 3. `service-worker.js` の `ASSETS` に画像パスを追加

```javascript
"./stamps/stamp_150.png",
```

### 4. キャッシュ名を変更

```javascript
const CACHE_NAME = "arithmetic-pwa-v9";
```

PWAは古いファイルをキャッシュするため、更新時は `v9`, `v10` のように変更してください。

### 5. GitHub Pagesへアップロード

以下を上書きアップロードしてください。

```text
index.html
style.css
app.js
manifest.json
service-worker.js
stamps/
icons/
```

## 注意

スタンプ取得状況と累計正解数は、iPad端末ごとのローカル保存です。複数台でスタンプ状況も共有したい場合は、Googleスプレッドシート側へ累計正解数または取得済みスタンプIDを保存する拡張が必要です。
