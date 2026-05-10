# スタンプ画像を追加・変更する手順

このアプリでは、スタンプの取得条件を「累計正解数」で判定します。

## 現在のルール

- スタンプ枠は30個です。
- 画像ファイル名は「必要正解数.png」で統一しています。
- 例：累計150問正解で取得するスタンプ画像は `stamps/150.png` です。

## スタンプ条件一覧

```text
1, 10, 30, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000
```

## 画像を差し替える場合

例：累計150問正解のスタンプ画像を変更する場合は、画像ファイルを次の名前で上書きします。

```text
stamps/150.png
```

推奨サイズは 512×512px のPNGです。

## 新しい条件に変更する場合

`stamps/stamps.js` の該当行を変更します。

```javascript
{
  id: "correct-150",
  name: "150問達成",
  requiredCorrect: 150,
  src: "stamps/150.png",
  description: "累計150問正解で取得"
}
```

画像名も `requiredCorrect` と同じ数字にしてください。

## service-worker.js の更新

スタンプ画像を追加・変更した場合は、`service-worker.js` の `ASSETS` に画像パスが入っていることを確認してください。

```javascript
"./stamps/150.png",
```

また、PWAは古いファイルをキャッシュするため、更新時はキャッシュ名を変更してください。

```javascript
const CACHE_NAME = "arithmetic-pwa-v15";
```

## GitHub Pagesへアップロードするもの

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
