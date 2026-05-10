/**
 * 計算チャレンジPWA 全iPad共通ランキング用 Google Apps Script
 *
 * 使い方:
 * 1. Googleスプレッドシートを作成
 * 2. 拡張機能 → Apps Script
 * 3. このコードを Code.gs に貼り付け
 * 4. デプロイ → 新しいデプロイ → 種類: ウェブアプリ
 * 5. 実行するユーザー: 自分
 * 6. アクセスできるユーザー: 全員
 */

const SHEET_NAME = 'Ranking';
const MAX_RANKING_ITEMS = 10;

const HEADERS = [
  'timestamp',
  'date',
  'playerName',
  'score',
  'correct',
  'total',
  'seconds',
  'digits',
  'operations',
  'deviceId'
];

function doGet(e) {
  const action = getParam_(e, 'action') || 'ranking';

  if (action === 'ranking') {
    return outputJsonp_(e, {
      ok: true,
      ranking: getTopRanking_()
    });
  }

  return outputJsonp_(e, {
    ok: false,
    error: 'unknown action'
  });
}

function doPost(e) {
  try {
    const payload = parsePostPayload_(e);

    if (!payload || payload.action !== 'submit') {
      return outputJson_({
        ok: false,
        error: 'invalid payload'
      });
    }

    const result = sanitizeResult_(payload.result || {});
    appendScore_(result);

    return outputJson_({
      ok: true,
      ranking: getTopRanking_()
    });
  } catch (error) {
    return outputJson_({
      ok: false,
      error: String(error)
    });
  }
}

function parsePostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return null;
  }
  return JSON.parse(e.postData.contents);
}

function appendScore_(result) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getRankingSheet_();
    sheet.appendRow([
      result.timestamp,
      result.date,
      result.playerName,
      result.score,
      result.correct,
      result.total,
      result.seconds,
      result.digits,
      result.operations,
      result.deviceId
    ]);
  } finally {
    lock.releaseLock();
  }
}

function getTopRanking_() {
  const sheet = getRankingSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  return values
    .map(row => ({
      timestamp: Number(row[0]) || 0,
      date: String(row[1] || ''),
      playerName: String(row[2] || 'プレイヤー'),
      score: Number(row[3]) || 0,
      correct: Number(row[4]) || 0,
      total: Number(row[5]) || 0,
      seconds: Number(row[6]) || 0,
      digits: Number(row[7]) || 1,
      operations: String(row[8] || ''),
      deviceId: String(row[9] || '')
    }))
    .sort(compareRanking_)
    .slice(0, MAX_RANKING_ITEMS);
}

function compareRanking_(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.correct !== a.correct) return b.correct - a.correct;
  if (a.seconds !== b.seconds) return a.seconds - b.seconds;
  return b.timestamp - a.timestamp;
}

function getRankingSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function sanitizeResult_(raw) {
  const now = Date.now();
  const score = clampNumber_(raw.score, 0, 999999999);
  const correct = clampNumber_(raw.correct, 0, 1000);
  const total = clampNumber_(raw.total, 1, 1000);
  const seconds = clampNumber_(raw.seconds, 0, 999999);
  const digits = clampNumber_(raw.digits, 1, 10);

  return {
    timestamp: clampNumber_(raw.timestamp, 1, 9999999999999) || now,
    date: limitText_(raw.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'), 40),
    playerName: limitText_(raw.playerName || 'プレイヤー', 20),
    score,
    correct,
    total,
    seconds,
    digits,
    operations: limitText_(raw.operations || '', 20),
    deviceId: limitText_(raw.deviceId || '', 80)
  };
}

function clampNumber_(value, min, max) {
  const n = Number(value);
  if (!isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function limitText_(value, maxLength) {
  return String(value)
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function getParam_(e, name) {
  return e && e.parameter ? e.parameter[name] : '';
}

function outputJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function outputJsonp_(e, obj) {
  const callback = getParam_(e, 'callback');

  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(obj)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return outputJson_(obj);
}

/**
 * Apps Scriptエディタ上で動作確認したい場合だけ実行します。
 */
function testAppendSampleScore() {
  appendScore_(sanitizeResult_({
    playerName: 'テスト',
    score: 1234,
    correct: 10,
    total: 10,
    seconds: 12.3,
    digits: 1,
    operations: '+ -',
    deviceId: 'test'
  }));
}
