const els = {
  settingsPanel: document.getElementById("settingsPanel"),
  quizPanel: document.getElementById("quizPanel"),
  resultPanel: document.getElementById("resultPanel"),
  playerName: document.getElementById("playerName"),
  questionCount: document.getElementById("questionCount"),
  digits: document.getElementById("digits"),
  noNegative: document.getElementById("noNegative"),
  integerDivision: document.getElementById("integerDivision"),
  startButton: document.getElementById("startButton"),
  retryButton: document.getElementById("retryButton"),
  backButton: document.getElementById("backButton"),
  refreshRankingButton: document.getElementById("refreshRankingButton"),
  progressText: document.getElementById("progressText"),
  timerText: document.getElementById("timerText"),
  progressBar: document.getElementById("progressBar"),
  questionText: document.getElementById("questionText"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  keypad: document.querySelector(".keypad"),
  feedback: document.getElementById("feedback"),
  scoreText: document.getElementById("scoreText"),
  correctText: document.getElementById("correctText"),
  timeText: document.getElementById("timeText"),
  rankingList: document.getElementById("rankingList"),
  rankingStatus: document.getElementById("rankingStatus"),
  newStampArea: document.getElementById("newStampArea"),
  newStampList: document.getElementById("newStampList"),
  stampStatus: document.getElementById("stampStatus"),
  stampList: document.getElementById("stampList"),
  installState: document.getElementById("installState"),
};

/*
  Google Apps Script の「ウェブアプリURL」をここに貼り付けます。
  例:
  const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw_Sn5_nHYpD8GE9uIHjAHWUh0g2HzWlP6BOK3j7qQA1rWOcBxWNR5rZXYgjNh2l5r2TA/exec";

  空欄のままなら、端末内ランキングだけで動きます。
*/
const GAS_WEB_APP_URL = "";

let settings = null;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let startTime = 0;
let questionStartTime = 0;
let questionResults = [];
let timerId = null;

const RANKING_STORAGE_KEY = "arithmetic-pwa-ranking-v1";
const PLAYER_STORAGE_KEY = "arithmetic-pwa-player-name-v1";
const DEVICE_STORAGE_KEY = "arithmetic-pwa-device-id-v1";
const PENDING_RANKING_STORAGE_KEY = "arithmetic-pwa-pending-ranking-v1";
const MAX_RANKING_ITEMS = 10;
const MAX_ANSWER_LENGTH = 12;
const PLAY_COUNT_STORAGE_KEY = "arithmetic-pwa-play-count-v1";
const STAMP_STORAGE_KEY = "arithmetic-pwa-unlocked-stamps-v1";
const STAMPS = Array.isArray(window.STAMP_DEFINITIONS) ? window.STAMP_DEFINITIONS : [];

function loadPlayCount() {
  const count = Number.parseInt(localStorage.getItem(PLAY_COUNT_STORAGE_KEY) || "0", 10);
  return Number.isNaN(count) ? 0 : count;
}

function savePlayCount(count) {
  localStorage.setItem(PLAY_COUNT_STORAGE_KEY, String(Math.max(0, count)));
}

function incrementPlayCount() {
  const next = loadPlayCount() + 1;
  savePlayCount(next);
  return next;
}

function loadUnlockedStampIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(STAMP_STORAGE_KEY)) || [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function saveUnlockedStampIds(ids) {
  const uniqueIds = [...new Set(ids.map(String))];
  localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(uniqueIds));
}

function unlockEligibleStamps(playCount) {
  const unlocked = new Set(loadUnlockedStampIds());
  const newlyUnlocked = [];

  STAMPS.forEach(stamp => {
    const requiredPlays = Number(stamp.requiredPlays || 0);
    if (requiredPlays <= playCount && !unlocked.has(stamp.id)) {
      unlocked.add(stamp.id);
      newlyUnlocked.push(stamp);
    }
  });

  if (newlyUnlocked.length) {
    saveUnlockedStampIds([...unlocked]);
  }

  return newlyUnlocked;
}

function renderNewStamps(stamps) {
  if (!els.newStampArea || !els.newStampList) return;

  if (!stamps.length) {
    els.newStampArea.classList.add("hidden");
    els.newStampList.innerHTML = "";
    return;
  }

  els.newStampArea.classList.remove("hidden");
  els.newStampList.innerHTML = stamps.map(stamp => `
    <div class="stampMiniCard">
      <img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}" />
      <strong>${escapeHtml(stamp.name)}</strong>
      <span>${escapeHtml(stamp.description || `${stamp.requiredPlays}回プレイ`)}</span>
    </div>
  `).join("");
}

function renderStampBook() {
  if (!els.stampList || !els.stampStatus) return;

  const playCount = loadPlayCount();
  const unlockedIds = new Set(loadUnlockedStampIds());
  const sortedStamps = STAMPS.slice().sort((a, b) => Number(a.requiredPlays || 0) - Number(b.requiredPlays || 0));
  const unlockedCount = sortedStamps.filter(stamp => unlockedIds.has(stamp.id)).length;

  els.stampStatus.textContent = `プレイ回数: ${playCount}回 / 取得済み: ${unlockedCount}個 / 全${sortedStamps.length}個`;

  if (!sortedStamps.length) {
    els.stampList.innerHTML = `<p class="muted">スタンプデータがありません。</p>`;
    return;
  }

  els.stampList.innerHTML = sortedStamps.map(stamp => {
    const unlocked = unlockedIds.has(stamp.id);
    const requiredPlays = Number(stamp.requiredPlays || 0);
    const remaining = Math.max(0, requiredPlays - playCount);

    if (unlocked) {
      return `
        <div class="stampCard acquired">
          <img src="${escapeHtml(stamp.src)}" alt="${escapeHtml(stamp.name)}" />
          <strong>${escapeHtml(stamp.name)}</strong>
          <span>${escapeHtml(stamp.description || `${requiredPlays}回プレイ`)}</span>
        </div>
      `;
    }

    return `
      <div class="stampCard locked">
        <div class="lockedStamp">?</div>
        <strong>未取得</strong>
        <span>${requiredPlays}回プレイで取得</span>
        <small>あと${remaining}回</small>
      </div>
    `;
  }).join("");
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function getSelectedOperations() {
  return [...document.querySelectorAll('input[name="operation"]:checked')].map(x => x.value);
}

function getPlayerName() {
  const name = (els.playerName.value || "").trim();
  return name || "プレイヤー";
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!id) {
    id = `ipad-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, id);
  }
  return id;
}

function getSettings() {
  const operations = getSelectedOperations();
  const playerName = getPlayerName();
  localStorage.setItem(PLAYER_STORAGE_KEY, playerName);

  return {
    playerName,
    questionCount: clampInt(els.questionCount.value, 1, 100, 10),
    digits: clampInt(els.digits.value, 1, 5, 1),
    operations: operations.length ? operations : ["+"],
    noNegative: els.noNegative.checked,
    integerDivision: els.integerDivision.checked,
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maxByDigits(digits) {
  return Math.pow(10, digits) - 1;
}

function minByDigits(digits) {
  return digits === 1 ? 0 : Math.pow(10, digits - 1);
}

function createQuestion(config) {
  const op = config.operations[randomInt(0, config.operations.length - 1)];
  const min = minByDigits(config.digits);
  const max = maxByDigits(config.digits);
  let a = randomInt(min, max);
  let b = randomInt(min, max);
  let answer = 0;

  if (op === "+") {
    answer = a + b;
  }

  if (op === "-") {
    if (config.noNegative && b > a) [a, b] = [b, a];
    answer = a - b;
  }

  if (op === "×") {
    answer = a * b;
  }

  if (op === "÷") {
    // 割り算は「a ÷ b = answer」の形で作る。
    // integerDivision=true の場合は、必ず割り切れる問題にする。
    b = randomInt(Math.max(1, min), Math.max(1, max));
    if (config.integerDivision) {
      answer = randomInt(min, max);
      a = b * answer;
    } else {
      a = randomInt(Math.max(1, min), max);
      answer = Number((a / b).toFixed(2));
    }
  }

  return {
    text: `${a} ${op} ${b}`,
    answer,
  };
}

function createQuestions(config) {
  return Array.from({ length: config.questionCount }, () => createQuestion(config));
}

function showOnly(panelName) {
  els.settingsPanel.classList.toggle("hidden", panelName !== "settings");
  els.quizPanel.classList.toggle("hidden", panelName !== "quiz");
  els.resultPanel.classList.toggle("hidden", panelName !== "result");
}

function startQuiz() {
  settings = getSettings();
  questions = createQuestions(settings);
  currentIndex = 0;
  correctCount = 0;
  questionResults = [];
  startTime = performance.now();
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  showOnly("quiz");
  showQuestion();
  startTimer();
}

function showQuestion() {
  const q = questions[currentIndex];
  els.progressText.textContent = `${currentIndex + 1} / ${questions.length}`;
  els.progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;
  els.questionText.textContent = `${q.text} = ?`;
  questionStartTime = performance.now();
  clearAnswer();
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    els.timerText.textContent = `${elapsedSeconds().toFixed(1)}秒`;
  }, 100);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function elapsedSeconds() {
  return (performance.now() - startTime) / 1000;
}

function clearAnswer() {
  els.answerInput.value = "";
}

function appendAnswer(value) {
  if (els.answerInput.value.length >= MAX_ANSWER_LENGTH) return;
  els.answerInput.value += value;
}

function backspaceAnswer() {
  els.answerInput.value = els.answerInput.value.slice(0, -1);
}

function toggleMinus() {
  const value = els.answerInput.value;
  if (value.startsWith("-")) {
    els.answerInput.value = value.slice(1);
  } else {
    els.answerInput.value = `-${value}`;
  }
}

function addDecimalPoint() {
  if (els.answerInput.value.includes(".")) return;
  if (els.answerInput.value === "" || els.answerInput.value === "-") {
    els.answerInput.value += "0.";
  } else {
    els.answerInput.value += ".";
  }
}

function handleKeypadClick(event) {
  const button = event.target.closest("button[data-key]");
  if (!button) return;

  const key = button.dataset.key;

  if (/^\d$/.test(key)) {
    appendAnswer(key);
    return;
  }

  if (key === "back") {
    backspaceAnswer();
    return;
  }

  if (key === "clear") {
    clearAnswer();
    return;
  }

  if (key === "minus") {
    toggleMinus();
    return;
  }

  if (key === "decimal") {
    addDecimalPoint();
  }
}

function isValidAnswerText(value) {
  return value !== "" && value !== "-" && value !== "." && value !== "-." && !Number.isNaN(Number(value));
}

function submitAnswer(event) {
  event.preventDefault();

  const answerText = els.answerInput.value.trim();
  if (!isValidAnswerText(answerText)) {
    els.feedback.textContent = "答えを入力してください";
    els.feedback.className = "feedback ng";
    return;
  }

  const q = questions[currentIndex];
  const userAnswer = Number(answerText);
  const isCorrect = userAnswer === q.answer;
  const questionSeconds = (performance.now() - questionStartTime) / 1000;

  questionResults.push({
    correct: isCorrect,
    seconds: Number(questionSeconds.toFixed(2)),
  });

  if (isCorrect) {
    correctCount++;
    els.feedback.textContent = "正解！";
    els.feedback.className = "feedback ok";
  } else {
    els.feedback.textContent = `不正解：正解は ${q.answer}`;
    els.feedback.className = "feedback ng";
  }

  currentIndex++;
  els.progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;

  setTimeout(() => {
    if (currentIndex >= questions.length) {
      finishQuiz();
    } else {
      els.feedback.textContent = "";
      els.feedback.className = "feedback";
      showQuestion();
    }
  }, 550);
}

function getOperationDifficulty(operations) {
  const weights = {
    "+": 1.0,
    "-": 1.0,
    "×": 1.3,
    "÷": 1.5,
  };

  const total = operations.reduce((sum, op) => sum + (weights[op] || 1), 0);
  return total / operations.length;
}

function calculateScore(correct, total, seconds, config, perQuestionResults = []) {
  // 1問だけを高速で終わらせても高得点にならないように、正解した問題数そのものを主点にする。
  // タイムボーナスは「1問ごとの回答時間」で計算し、10秒を超えた問題は0点にする。
  const digitMultiplier = 1 + (config.digits - 1) * 0.75;
  const operationMultiplier = getOperationDifficulty(config.operations);
  const difficulty = digitMultiplier * operationMultiplier;

  const correctScore = correct * 100 * difficulty;
  const perfectBonus = correct === total ? total * 20 * difficulty : 0;

  const maxBonusPerQuestion = 30 * difficulty;
  const speedBonus = perQuestionResults.reduce((sum, item) => {
    if (!item.correct) return sum;
    if (item.seconds > 10) return sum;

    // 0秒に近いほど満点、10秒で0点。
    const ratio = Math.max(0, (10 - item.seconds) / 10);
    return sum + maxBonusPerQuestion * ratio;
  }, 0);

  return Math.max(0, Math.round(correctScore + perfectBonus + speedBonus));
}

function finishQuiz() {
  stopTimer();
  const seconds = elapsedSeconds();
  const score = calculateScore(correctCount, questions.length, seconds, settings, questionResults);

  els.scoreText.textContent = `${score}点`;
  els.correctText.textContent = `${correctCount} / ${questions.length}`;
  els.timeText.textContent = `${seconds.toFixed(1)}秒`;

  const result = {
    date: new Date().toLocaleString("ja-JP"),
    timestamp: Date.now(),
    playerName: settings.playerName,
    score,
    correct: correctCount,
    total: questions.length,
    seconds: Number(seconds.toFixed(1)),
    digits: settings.digits,
    operations: settings.operations.join(" "),
    deviceId: getDeviceId(),
  };

  const playCount = incrementPlayCount();
  const newlyUnlockedStamps = unlockEligibleStamps(playCount);

  saveLocalRanking(result);
  renderRanking(loadLocalRanking());
  renderNewStamps(newlyUnlockedStamps);
  renderStampBook();
  showOnly("result");

  syncRankingAfterResult(result);
}

function compareRanking(a, b) {
  const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;

  const correctDiff = Number(b.correct || 0) - Number(a.correct || 0);
  if (correctDiff !== 0) return correctDiff;

  const secondsDiff = Number(a.seconds || 999999) - Number(b.seconds || 999999);
  if (secondsDiff !== 0) return secondsDiff;

  return Number(b.timestamp || 0) - Number(a.timestamp || 0);
}

function saveLocalRanking(result) {
  const ranking = loadLocalRanking();
  ranking.push(result);
  ranking.sort(compareRanking);
  localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(ranking.slice(0, MAX_RANKING_ITEMS)));
}

function loadLocalRanking() {
  try {
    const ranking = JSON.parse(localStorage.getItem(RANKING_STORAGE_KEY)) || [];
    return Array.isArray(ranking) ? ranking : [];
  } catch {
    return [];
  }
}

function hasGasEndpoint() {
  return GAS_WEB_APP_URL && GAS_WEB_APP_URL.startsWith("https://script.google.com/macros/s/");
}

function setRankingStatus(text) {
  els.rankingStatus.textContent = text;
}

async function syncRankingAfterResult(result) {
  if (!hasGasEndpoint()) {
    setRankingStatus("端末内ランキングを表示しています。全iPad共通ランキングにする場合は app.js にGoogle Apps ScriptのURLを設定してください。");
    return;
  }

  if (!navigator.onLine) {
    savePendingRanking(result);
    setRankingStatus("オフラインのため端末内ランキングを表示しています。このスコアはオンライン復帰後に自動送信します。");
    return;
  }

  setRankingStatus("全体ランキングへ送信中です...");
  try {
    await flushPendingRanking();
    await submitGlobalRanking(result);
    setRankingStatus("送信しました。全体ランキングを更新中です...");
    setTimeout(refreshGlobalRanking, 1000);
  } catch (error) {
    console.warn("ランキング送信失敗", error);
    savePendingRanking(result);
    setRankingStatus("送信に失敗したため、端末内ランキングを表示しています。このスコアは次回オンライン時に再送信します。");
  }
}

function loadPendingRanking() {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_RANKING_STORAGE_KEY)) || [];
    return Array.isArray(pending) ? pending : [];
  } catch {
    return [];
  }
}

function savePendingRanking(result) {
  const pending = loadPendingRanking();
  const key = `${result.timestamp}-${result.deviceId}-${result.score}`;
  const exists = pending.some(item => `${item.timestamp}-${item.deviceId}-${item.score}` === key);
  if (!exists) {
    pending.push(result);
  }
  localStorage.setItem(PENDING_RANKING_STORAGE_KEY, JSON.stringify(pending.slice(-50)));
}

function clearPendingRanking() {
  localStorage.removeItem(PENDING_RANKING_STORAGE_KEY);
}

async function flushPendingRanking() {
  if (!hasGasEndpoint() || !navigator.onLine) return;

  const pending = loadPendingRanking();
  if (!pending.length) return;

  for (const item of pending) {
    await submitGlobalRanking(item);
  }

  clearPendingRanking();
}

async function submitGlobalRanking(result) {
  const payload = {
    action: "submit",
    result,
  };

  // Apps ScriptはCORS制限が出やすいため、送信は no-cors にする。
  // no-corsではレスポンス本文は読めないが、スコア送信用途では問題ない。
  await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
}

function refreshGlobalRanking() {
  if (!hasGasEndpoint()) {
    renderRanking(loadLocalRanking());
    setRankingStatus("端末内ランキングを表示しています。");
    return;
  }

  if (!navigator.onLine) {
    renderRanking(loadLocalRanking());
    setRankingStatus("オフラインのため端末内ランキングを表示しています。");
    return;
  }

  setRankingStatus("全体ランキングを取得中です...");
  flushPendingRanking()
    .then(() => fetchGlobalRankingJsonp())
    .then(data => {
      if (!data || !data.ok) {
        throw new Error(data && data.error ? data.error : "ランキング取得失敗");
      }
      const ranking = Array.isArray(data.ranking) ? data.ranking : [];
      renderRanking(ranking);
      setRankingStatus("全iPad共通ランキングを表示しています。");
    })
    .catch(error => {
      console.warn("ランキング取得失敗", error);
      renderRanking(loadLocalRanking());
      setRankingStatus("全体ランキングを取得できないため、端末内ランキングを表示しています。");
    });
}

function fetchGlobalRankingJsonp() {
  return new Promise((resolve, reject) => {
    const callbackName = `rankingCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("ランキング取得がタイムアウトしました"));
    }, 10000);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP読み込みに失敗しました"));
    };

    const url = new URL(GAS_WEB_APP_URL);
    url.searchParams.set("action", "ranking");
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("t", String(Date.now()));

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function renderRanking(ranking) {
  const list = Array.isArray(ranking) ? ranking.slice().sort(compareRanking).slice(0, MAX_RANKING_ITEMS) : [];
  if (!list.length) {
    els.rankingList.innerHTML = "<li>まだランキングはありません。</li>";
    return;
  }

  els.rankingList.innerHTML = list.map(item => `
    <li>
      <strong>${escapeHtml(item.playerName || "プレイヤー")}：${Number(item.score || 0)}点</strong>
      <br>${Number(item.correct || 0)}/${Number(item.total || 0)}問・${Number(item.seconds || 0)}秒
      <br><small>${escapeHtml(item.date || "")}・${Number(item.digits || 1)}桁・${escapeHtml(item.operations || "")}</small>
    </li>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

function restorePlayerName() {
  const saved = localStorage.getItem(PLAYER_STORAGE_KEY);
  if (saved) els.playerName.value = saved;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    els.installState.textContent = "SW非対応";
    return;
  }
  try {
    await navigator.serviceWorker.register("service-worker.js");
    els.installState.textContent = "PWA";
  } catch (error) {
    console.warn("Service Worker登録失敗", error);
    els.installState.textContent = "要HTTPS";
  }
}

els.startButton.addEventListener("click", startQuiz);
els.retryButton.addEventListener("click", startQuiz);
els.backButton.addEventListener("click", () => showOnly("settings"));
els.answerForm.addEventListener("submit", submitAnswer);
els.keypad.addEventListener("click", handleKeypadClick);
els.refreshRankingButton.addEventListener("click", refreshGlobalRanking);

// iPadのソフトウェアキーボードを出さないため、答え欄はフォーカスされてもすぐ外す。
els.answerInput.addEventListener("focus", () => els.answerInput.blur());
els.answerInput.addEventListener("keydown", event => event.preventDefault());

window.addEventListener("online", refreshGlobalRanking);

restorePlayerName();
renderRanking(loadLocalRanking());
renderStampBook();
refreshGlobalRanking();
registerServiceWorker();
