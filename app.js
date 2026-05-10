const els = {
  settingsPanel: document.getElementById("settingsPanel"),
  quizPanel: document.getElementById("quizPanel"),
  resultPanel: document.getElementById("resultPanel"),
  questionCount: document.getElementById("questionCount"),
  digits: document.getElementById("digits"),
  noNegative: document.getElementById("noNegative"),
  integerDivision: document.getElementById("integerDivision"),
  startButton: document.getElementById("startButton"),
  retryButton: document.getElementById("retryButton"),
  backButton: document.getElementById("backButton"),
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
  historyList: document.getElementById("historyList"),
  installState: document.getElementById("installState"),
};

let settings = null;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let startTime = 0;
let timerId = null;

const STORAGE_KEY = "arithmetic-pwa-history-v1";
const MAX_ANSWER_LENGTH = 12;

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function getSelectedOperations() {
  return [...document.querySelectorAll('input[name="operation"]:checked')].map(x => x.value);
}

function getSettings() {
  const operations = getSelectedOperations();
  return {
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

function calculateScore(correct, total, seconds) {
  // 正答率を重視し、タイムが速いほど少し加点。
  // 全問正解・短時間ほど高得点になる。
  const accuracyScore = (correct / total) * 1000;
  const timeBonus = Math.max(0, 300 - seconds * 10);
  return Math.round(accuracyScore + timeBonus);
}

function finishQuiz() {
  stopTimer();
  const seconds = elapsedSeconds();
  const score = calculateScore(correctCount, questions.length, seconds);

  els.scoreText.textContent = `${score}点`;
  els.correctText.textContent = `${correctCount} / ${questions.length}`;
  els.timeText.textContent = `${seconds.toFixed(1)}秒`;

  saveHistory({
    date: new Date().toLocaleString("ja-JP"),
    score,
    correct: correctCount,
    total: questions.length,
    seconds: Number(seconds.toFixed(1)),
    digits: settings.digits,
    operations: settings.operations.join(" "),
  });
  renderHistory();
  showOnly("result");
}

function saveHistory(result) {
  const history = loadHistory();
  history.unshift(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 10)));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = loadHistory();
  if (!history.length) {
    els.historyList.innerHTML = "<li>まだ履歴はありません。</li>";
    return;
  }
  els.historyList.innerHTML = history.map(item => `
    <li>
      <strong>${item.score}点</strong> / ${item.correct}/${item.total}問 / ${item.seconds}秒
      <br><small>${item.date}・${item.digits}桁・${item.operations}</small>
    </li>
  `).join("");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    els.installState.textContent = "SW非対応";
    return;
  }
  try {
    await navigator.serviceWorker.register("service-worker.js");
    els.installState.textContent = "オフライン対応";
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

// iPadのソフトウェアキーボードを出さないため、答え欄はフォーカスされてもすぐ外す。
els.answerInput.addEventListener("focus", () => els.answerInput.blur());
els.answerInput.addEventListener("keydown", event => event.preventDefault());

renderHistory();
registerServiceWorker();
