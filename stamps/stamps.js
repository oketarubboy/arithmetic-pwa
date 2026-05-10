// スタンプ設定ファイル
// 画像を追加したい場合は、この配列に1行追加し、service-worker.jsのASSETSにも画像パスを追加してください。
// requiredCorrect は「累計正解数」です。
window.STAMP_DEFINITIONS = [
  {
    id: "correct-1",
    name: "はじめの一歩",
    requiredCorrect: 1,
    src: "stamps/stamp_01.png",
    description: "累計1問正解で取得"
  },
  {
    id: "correct-10",
    name: "れんしゅう中",
    requiredCorrect: 10,
    src: "stamps/stamp_03.png",
    description: "累計10問正解で取得"
  },
  {
    id: "correct-30",
    name: "計算好き",
    requiredCorrect: 30,
    src: "stamps/stamp_05.png",
    description: "累計30問正解で取得"
  },
  {
    id: "correct-50",
    name: "50問チャレンジ",
    requiredCorrect: 50,
    src: "stamps/stamp_10.png",
    description: "累計50問正解で取得"
  },
  {
    id: "correct-100",
    name: "計算マスター",
    requiredCorrect: 100,
    src: "stamps/stamp_20.png",
    description: "累計100問正解で取得"
  }
];
