# ランキング重複行の削除と再発防止（v17）

## 1. 既存の重複行を削除する方法

Apps Scriptの `Code.gs` をv17の内容に更新し、新しいバージョンとしてデプロイした後、次のどちらかで削除できます。

### 方法A：Apps Scriptエディタから実行

1. Googleスプレッドシートを開く
2. 拡張機能 → Apps Script
3. 関数の選択で `cleanupDuplicateRankingRows` を選択
4. 実行

同じ内容の行が複数ある場合、最初の1行だけ残して後ろの行を削除します。

### 方法B：ブラウザから実行

WebアプリURLの末尾に下記を付けて開きます。

```text
?action=cleanup&callback=testCallback
```

例：

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec?action=cleanup&callback=testCallback
```

正常に実行されると、次のような結果が表示されます。

```javascript
testCallback({"ok":true,"removed":1,"ranking":[...]});
```

`removed` が削除された行数です。

## 2. 今後の重複防止

v17では、PWA側で1回のプレイ結果ごとに `submissionId` を発行します。

Apps Script側では、同じ `submissionId` の結果は2回登録しません。

さらに、過去バージョンのように `submissionId` が無いデータでも、以下が同じなら重複として扱います。

- 日時
- プレイヤー名
- スコア
- 正解数
- 問題数
- 秒数
- 計算種類
- 端末ID

## 3. 反映手順

1. GitHub Pagesにv17のファイルを上書きアップロード
2. Apps Scriptの `Code.gs` をv17に貼り替える
3. Apps Scriptを保存
4. デプロイ → デプロイを管理 → 鉛筆アイコン
5. バージョンを「新バージョン」にしてデプロイ
6. 必要に応じて `cleanupDuplicateRankingRows` を実行
