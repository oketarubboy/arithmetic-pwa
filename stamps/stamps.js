// スタンプ設定ファイル
// 画像を追加したい場合は、この配列に1行追加し、service-worker.jsのASSETSにも画像パスを追加してください。
window.STAMP_DEFINITIONS = [
  {
    id: "play-1",
    name: "はじめの一歩",
    requiredPlays: 1,
    src: "stamps/stamp_01.png",
    description: "1回プレイで取得"
  },
  {
    id: "play-3",
    name: "れんしゅう中",
    requiredPlays: 3,
    src: "stamps/stamp_03.png",
    description: "3回プレイで取得"
  },
  {
    id: "play-5",
    name: "計算好き",
    requiredPlays: 5,
    src: "stamps/stamp_05.png",
    description: "5回プレイで取得"
  },
  {
    id: "play-10",
    name: "10回チャレンジ",
    requiredPlays: 10,
    src: "stamps/stamp_10.png",
    description: "10回プレイで取得"
  },
  {
    id: "play-20",
    name: "計算マスター",
    requiredPlays: 20,
    src: "stamps/stamp_20.png",
    description: "20回プレイで取得"
  }
];
