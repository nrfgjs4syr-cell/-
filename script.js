// 一次関数ゲーム - 携帯向けUI強化バージョン

// --- 状態変数 ---
let currentA = 1, currentB = 0, currentX = 0, currentY = 0;
let questionType = "y";
let graphA = 1, graphB = 0, graphChart = null;
let currentGameQuestionType = "algebra";

let score = 0, life = 3, level = 1, timer = 30, timerInterval = null;
let gameActive = false;
let totalQuestions = 10, currentQuestion = 0, correctCount = 0;
let wrongProblems = [];

// --- wrongProblems 表示更新（未定義によるクラッシュ回避のため追加） ---
function updateWrongProblemsPanel() {
  try {
    const panel = document.getElementById('similarProblemsPanel');
    const list = document.getElementById('similarProblemsList');
    if (!panel || !list) return;
    if (!Array.isArray(wrongProblems) || wrongProblems.length === 0) {
      panel.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    panel.style.display = 'block';
    list.innerHTML = '';
    wrongProblems.forEach((p, idx) => {
      const li = document.createElement('li');
      // wrongProblems の中身がオブジェクトなら読みやすく整形
      if (typeof p === 'string') li.textContent = p;
      else if (p && typeof p === 'object') {
        // 例: {question: "...", a:..., b:...}
        if (p.question) li.textContent = p.question;
        else li.textContent = JSON.stringify(p);
      } else {
        li.textContent = String(p);
      }
      list.appendChild(li);
    });
  } catch (err) {
    console.error('updateWrongProblemsPanel error:', err);
  }
}

// --- モバイル対応：input自動フォーカス ---
function focusAnswerInput() {
  setTimeout(() => {
    const ids = ["answerInput", "answerInputA", "answerInputB", "equationInput", "slopeInput", "interceptInput", "tableAnswerInput"];
    for(const id of ids) {
      const el = document.getElementById(id);
      if (el && el.style.display !== "none") { el.focus(); try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch{} break; }
    }
  }, 300);
}

// --- モバイル対応：inputでエンター即判定 ---
function attachInputKeyEvents() {
  const check = () => { const cb = document.getElementById("checkBtn"); if(cb && cb.style.display !== "none") checkAnswer(); };
  const graphCheck = () => { const gcb = document.getElementById("graphCheckBtn"); if(gcb && gcb.style.display !== "none") checkGraphAnswer(); };
  ["answerInput","answerInputA","answerInputB","equationInput","slopeInput","interceptInput","tableAnswerInput"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) {
      el.onkeydown = (ev) => {
        if(ev.key === "Enter") {
          ev.preventDefault();
          if(id==="tableAnswerInput") check();
          else if(id==="equationInput" || id==="slopeInput" || id==="interceptInput") graphCheck();
          else check();
        }
      }
    }
  });
}
window.addEventListener('DOMContentLoaded', attachInputKeyEvents);

// --- ユーティリティ ---
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function clampDecimal(val) { return Math.round(val * 10) / 10; }

// --- 難易度 / 範囲 ---
function getLifeLimitByDifficulty(d) { return d === "easy" ? 5 : d === "normal" ? 4 : 3; }
function getTimeLimitByDifficulty(d) { return d === "easy" ? 45 : d === "normal" ? 60 : 40; }

function setDifficultyRange(difficulty) {
  if (difficulty === "easy") {
    window.autoRange = { aMin: 1, aMax: 3, bMin: -3, bMax: 3, xMin: 0, xMax: 5 };
  } else if (difficulty === "normal") {
    window.autoRange = { aMin: -5, aMax: 5, bMin: -5, bMax: 5, xMin: -5, xMax: 10 };
  } else {
    window.autoRange = { aMin: -10, aMax: 10, bMin: -10, bMax: 10, xMin: -10, xMax: 20 };
  }
  window.lifeLimit = getLifeLimitByDifficulty(difficulty);
  window.timeLimit = getTimeLimitByDifficulty(difficulty);
}

function applyCustomRange() {
  const v = Number(document.getElementById("totalQuestionsInput").value);
  if (v >= 1) totalQuestions = v;
}

function getRanges() { return window.autoRange || { aMin:1, aMax:3, bMin:-3, bMax:3, xMin:0, xMax:5 }; }

function onProblemTypeChange() {
  const v = document.getElementById("problemType").value;
  if (["algebra","graph","table","rate","mix"].includes(v)) currentGameQuestionType = v;
}

// --- ゲーム制御 ---
function startGame() {
  score = 0; level = 1; currentQuestion = 0; correctCount = 0; gameActive = true;
  setDifficultyRange(document.getElementById("difficulty").value);
  life = window.lifeLimit; timer = window.timeLimit;
  document.getElementById("score").textContent = score;
  document.getElementById("life").textContent = life;
  document.getElementById("level").textContent = level;
  document.getElementById("timer").textContent = timer;
  const startBtn = document.getElementById("startBtn"); if (startBtn) startBtn.style.display = "none";
  const retryBtn = document.getElementById("retryBtn"); if (retryBtn) retryBtn.style.display = "none";
  const similarBtn = document.getElementById("similarBtn"); if (similarBtn) similarBtn.style.display = wrongProblems.length > 0 ? "inline-block" : "none";
  // 定義漏れで例外にならないようガードして呼ぶ
  if (typeof updateWrongProblemsPanel === 'function') updateWrongProblemsPanel();
  applyCustomRange();
  generateGameQuestion();
  startTimer();
}
function retryGame(){ startGame(); }

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    if(!gameActive){ clearInterval(timerInterval); return; }
    timer--; const tEl = document.getElementById("timer"); if (tEl) tEl.textContent = timer;
    if(timer <= 0) loseLife();
  }, 1000);
}

function loseLife() {
  life--; const lifeEl = document.getElementById("life"); if (lifeEl) lifeEl.textContent = life;
  timer = window.timeLimit; const tEl = document.getElementById("timer"); if (tEl) tEl.textContent = timer;
  if (life <= 0) endGame();
  else setTimeout(()=>{ generateGameQuestion(); focusAnswerInput(); }, 800);
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);

  const goPanel = document.getElementById("gameOverPanel");
  if (goPanel) goPanel.style.display = "block";

  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) retryBtn.style.display = "inline-block";

  const checkBtn = document.getElementById("checkBtn");
  if (checkBtn) checkBtn.style.display = "none";

  const graphCheckBtn = document.getElementById("graphCheckBtn");
  if (graphCheckBtn) graphCheckBtn.style.display = "none";

  const graphPanel = document.getElementById("graphPanel");
  if (graphPanel) graphPanel.style.display = "none";

  const tablePanel = document.getElementById("tablePanel");
  if (tablePanel) tablePanel.style.display = "none";

  const qn = document.getElementById("questionNumber");
  if (qn) qn.textContent = "";

  const resultSummary = document.getElementById("resultSummary");
  if (resultSummary) {
    resultSummary.textContent =
      `終了！正解数: ${correctCount} / ${totalQuestions}（正答率: ${Math.round((correctCount/totalQuestions)*100)}%）`;
  }
}

// --- 出題ロジック ---
function generateGameQuestion() {
  if (!gameActive) return;
  if (currentQuestion >= totalQuestions) { endGame(); return; }

  currentQuestion++;
  const qnEl = document.getElementById("questionNumber");
  if (qnEl) qnEl.textContent = `【第${currentQuestion}問 / 全${totalQuestions}問】`;

  hideAllAnswerUI();

  let type = currentGameQuestionType;
  if (type === "mix") {
    const arr = ["algebra","graph","table","rate"];
    type = arr[randInt(0, arr.length-1)];
  }

  if (type === "algebra") generateAlgebraQuestionImproved();
  else if (type === "graph") { const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; if (typeof generateGraphQuestion === 'function') generateGraphQuestion(true); }
  else if (type === "table") if (typeof generateTableQuestion === 'function') generateTableQuestion();
  else if (type === "rate") generateRateQuestion();

  focusAnswerInput();
}

function hideAllAnswerUI() {
  const ar = document.getElementById("answerResult"); if (ar) ar.textContent = "";
  const hint = document.getElementById("hintText"); if (hint) { hint.style.display = "none"; hint.textContent = ""; }
  ["answerInput","answerInputA","answerInputB","equationInput","slopeInput","interceptInput"].forEach(id=>{
    const el = document.getElementById(id); if (el) el.style.display = "none";
  });
  const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "none";
  const gcb = document.getElementById("graphCheckBtn"); if (gcb) gcb.style.display = "none";
  const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "none";
  const tcb = document.getElementById("tableCheckBtn"); if (tcb) tcb.style.display = "none";
  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "none";
  const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = "none";
}

// ----- 改良された計算問題 -----
function generateAlgebraQuestionImproved() {
  if (!gameActive) return;
  const range = getRanges();
  const difficulty = document.getElementById("difficulty").value || "easy";

  const pool = difficulty === "easy" ? ["y","ab","y"] :
               difficulty === "normal" ? ["y","a","b","2pt"] :
               ["y","a","b","2pt","eq","y"];
  questionType = pool[randInt(0, pool.length-1)];

  let a = randInt(range.aMin, range.aMax);
  let b = randInt(range.bMin, range.bMax);
  if (difficulty === "hard" && Math.random() < 0.35) {
    a = clampDecimal(a + (Math.random()<0.5?-0.5:0.5));
    b = clampDecimal(b + (Math.random()<0.5?-0.5:0.5));
  }
  if (a === 0) a = (range.aMin <= 1 && range.aMax >=1) ? 1 : (range.aMin || 1);

  currentA = a; currentB = b;

  if (questionType === "y") {
    currentX = randInt(range.xMin, range.xMax);
    currentY = currentA * currentX + currentB;
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `一次関数 y = ax + b のとき、x = ${currentX} の y の値はいくつですか？`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
  } else if (questionType === "a") {
    currentX = randInt(range.xMin || -5, range.xMax || 5);
    currentY = currentA * currentX + currentB;
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `x = ${currentX} のとき、y = ${currentY} となる一次関数の傾き a を求めなさい。`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
  } else if (questionType === "b") {
    currentX = randInt(range.xMin || -5, range.xMax || 5);
    currentY = currentA * currentX + currentB;
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `x = ${currentX} のとき、y = ${currentY} となる一次関数の切片 b を求めなさい。`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
  } else if (questionType === "ab") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `次の一次関数の a（傾き）と b（切片）を答えてください。`;
    const aEl = document.getElementById("answerInputA"); if (aEl) aEl.style.display = "inline";
    const bEl = document.getElementById("answerInputB"); if (bEl) bEl.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
    if (typeof drawAlgebraGraph === 'function') try { drawAlgebraGraph(currentA, currentB); } catch(e){ console.error(e); }
    focusAnswerInput();
    return;
  } else if (questionType === "2pt") {
    let x1 = randInt(range.xMin, range.xMax);
    let x2 = randInt(range.xMin, range.xMax);
    while (x2 === x1) x2 = randInt(range.xMin, range.xMax);
    const y1 = currentA * x1 + currentB;
    const y2 = currentA * x2 + currentB;
    currentA = (y2 - y1) / (x2 - x1);
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `点 (${x1}, ${y1}) と (${x2}, ${y2}) を通る直線の傾き a を求めなさい。`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
    focusAnswerInput();
    return;
  } else if (questionType === "eq") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `下のグラフを見て、一次関数の式 y = ax + b の a と b を答えてください。`;
    const aEl = document.getElementById("answerInputA"); if (aEl) aEl.style.display = "inline";
    const bEl = document.getElementById("answerInputB"); if (bEl) bEl.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
    if (typeof drawAlgebraGraph === 'function') try { drawAlgebraGraph(currentA, currentB); } catch(e){ console.error(e); }
    focusAnswerInput();
    return;
  }

  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
  if (typeof drawAlgebraGraph === 'function') try { drawAlgebraGraph(currentA, currentB); } catch(e){ console.error(e); }
  focusAnswerInput();
}

// ----- 変化の割合(rate) -----
function generateRateQuestion() {
  if (!gameActive) return;
  const range = getRanges();
  let a = randInt(range.aMin, range.aMax); if (a === 0) a = 1;
  let b = randInt(range.bMin, range.bMax);
  let x1 = randInt(range.xMin, range.xMax);
  let x2 = randInt(range.xMin, range.xMax);
  while (x2 === x1) x2 = randInt(range.xMin, range.xMax);
  const y1 = a * x1 + b;
  const y2 = a * x2 + b;
  currentA = (y2 - y1) / (x2 - x1);
  currentB = null; currentX = null; currentY = null;
  questionType = "rate";

  const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `点 (${x1}, ${y1}) と (${x2}, ${y2}) の変化の割合（Δy/Δx）を求めなさい。`;
  const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline";
  const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
  const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";

  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
  if (typeof drawAlgebraGraph === 'function') try { drawAlgebraGraph(a, b); } catch(e){ console.error(e); }

  focusAnswerInput();
}

// ...（この後は既存のscript.js通り。イベントバインドなどは上書きや重複を避けるために既存どおりに記述）...
// 必要があれば他の関数にも `focusAnswerInput()` を加えます。
