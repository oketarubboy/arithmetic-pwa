# スタンプ機能の使い方

## 概要

プレイ回数が指定回数に到達すると、スタンプ帳に画像スタンプが追加されます。
取得状態はiPad端末内の `localStorage` に保存されます。

初期スタンプ:

| スタンプ | 条件 |
|---|---:|
| はじめの一歩 | 1回プレイ |
| れんしゅう中 | 3回プレイ |
| 計算好き | 5回プレイ |
| 10回チャレンジ | 10回プレイ |
| 計算マスター | 20回プレイ |

## スタンプ設定ファイル

`stamps/stamps.js` を編集します。

```javascript
window.STAMP_DEFINITIONS = [
  {
    id: "play-1",
    name: "はじめの一歩",
    requiredPlays: 1,
    src: "stamps/stamp_01.png",
    description: "1回プレイで取得"
  }
];
```

## 画像追加手順

1. 画像を `stamps/` フォルダに入れる
2. `stamps/stamps.js` に設定を追加する
3. `service-worker.js` の `ASSETS` に画像パスを追加する
4. `service-worker.js` の `CACHE_NAME` を v8、v9 のように変更する
5. GitHub Pagesへ上書きアップロードする
6. iPadのSafariで `?v=更新番号` を付けて開く

## 追加例

画像ファイル:

```text
stamps/stamp_30.png
```

`stamps/stamps.js` に追加:

```javascript
{
  id: "play-30",
  name: "30回達成",
  requiredPlays: 30,
  src: "stamps/stamp_30.png",
  description: "30回プレイで取得"
}
```

`service-worker.js` の `ASSETS` に追加:

```javascript
"./stamps/stamp_30.png"
```

キャッシュ名を変更:

```javascript
const CACHE_NAME = "arithmetic-pwa-v8";
```

## 注意

- 画像サイズは 512×512 PNG 推奨です。
- 日本語ファイル名より、`stamp_30.png` のような半角英数字のファイル名を推奨します。
- 端末内保存のため、iPadごとに取得済みスタンプは別管理です。
- iPad間でスタンプ取得状況も共有したい場合は、ランキングと同じようにGoogleスプレッドシート側へプレイ回数や取得スタンプIDを保存する拡張が必要です。
