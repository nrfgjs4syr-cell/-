// 一次関数ゲーム - 完全版スクリプト（グラフ描画・判定・ヒント・フォールバック含む）

// --- 状態変数 ---
let currentA = 1, currentB = 0, currentX = 0, currentY = 0;
let questionType = "y"; // y, a, b, ab, 2pt, eq, rate
let graphA = 1, graphB = 0, graphChart = null;
let currentGameQuestionType = "algebra";

let score = 0, life = 3, level = 1, timer = 30, timerInterval = null;
let gameActive = false;
let totalQuestions = 10, currentQuestion = 0, correctCount = 0;
let wrongProblems = [];

// --- ユーティリティ ---
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function clampDecimal(val) { return Math.round(val * 10) / 10; }
function approxEqual(a, b, eps = 1e-6) { return Math.abs(a - b) < eps; }
function parseNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

// --- wrongProblems 表示更新 ---
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
    wrongProblems.forEach((p) => {
      const li = document.createElement('li');
      if (typeof p === 'string') li.textContent = p;
      else if (p && typeof p === 'object') li.textContent = p.question || JSON.stringify(p);
      else li.textContent = String(p);
      list.appendChild(li);
    });
  } catch (err) { console.error('updateWrongProblemsPanel error:', err); }
}

// --- モバイル対応：input自動フォーカス ---
function focusAnswerInput() {
  setTimeout(() => {
    const ids = ["answerInput", "answerInputA", "answerInputB", "equationInput", "slopeInput", "interceptInput", "tableAnswerInput"];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.style.display !== "none") { el.focus(); try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { } break; }
    }
  }, 300);
}

// --- モバイル対応：inputでエンター即判定 ---
function attachInputKeyEvents() {
  const check = () => { const cb = document.getElementById("checkBtn"); if (cb && cb.style.display !== "none") checkAnswer(); };
  const graphCheck = () => { const gcb = document.getElementById("graphCheckBtn"); if (gcb && gcb.style.display !== "none") checkGraphAnswer(); };
  ["answerInput", "answerInputA", "answerInputB", "equationInput", "slopeInput", "interceptInput", "tableAnswerInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.onkeydown = (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          if (id === "tableAnswerInput") check();
          else if (id === "equationInput" || id === "slopeInput" || id === "interceptInput") graphCheck();
          else check();
        }
      }
    }
  });

  // startBtn に touchend を追加（スマホ対策）
  const startBtn = document.getElementById('startBtn');
  if (startBtn && !startBtn._touchBound) {
    startBtn.addEventListener('touchend', (e) => { e.preventDefault(); startBtn.click(); }, { passive: false });
    startBtn._touchBound = true;
  }
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', attachInputKeyEvents);
else attachInputKeyEvents();

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
function getRanges() { return window.autoRange || { aMin: 1, aMax: 3, bMin: -3, bMax: 3, xMin: 0, xMax: 5 }; }
function onProblemTypeChange() {
  const v = document.getElementById("problemType").value;
  if (["algebra", "graph", "table", "rate", "mix"].includes(v)) currentGameQuestionType = v;
}

// --- グラフ描画（Chart.js 利用 / フォールバック） ---
function drawAlgebraGraph(a, b) {
  try {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    // Chart.js があれば使用
    if (window.Chart) {
      if (graphChart) { try { graphChart.destroy(); } catch{} graphChart = null; }
      const labels = [];
      const data = [];
      const minX = -10, maxX = 10;
      for (let x = minX; x <= maxX; x++) { labels.push(x); data.push(a * x + b); }
      const ctx = canvas.getContext('2d');
      graphChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: `y = ${a}x + ${b}`, data, borderColor: '#3578e5', backgroundColor: 'rgba(53,120,229,0.08)', fill: false, pointRadius: 0, pointHoverRadius: 0, tension: 0 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { display: true }, y: { display: true } },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false } // ツールチップを無効化（これでクリックやホバーで式が出なくなります）
          },
          elements: {
            point: { radius: 0, hoverRadius: 0 } // ポイント自体の反応を無くす
          }
        }
      });
      return;
    }

    // フォールバック（canvas）
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(300, Math.floor(w * ratio));
    canvas.height = Math.max(200, Math.floor(h * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, w, h);
    const minX = -10, maxX = 10;
    const yVals = []; for (let x = minX; x <= maxX; x++) yVals.push(a * x + b);
    const minY = Math.min(...yVals), maxY = Math.max(...yVals);
    const ys = (maxY - minY) || 1;
    const y0 = h - ((0 - minY) / ys) * h;
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke();
    ctx.strokeStyle = '#3578e5'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= (maxX - minX); i++) {
      const xVal = minX + i;
      const yVal = a * xVal + b;
      const px = (i / (maxX - minX)) * w;
      const py = h - ((yVal - minY) / ys) * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } catch (err) { console.error('drawAlgebraGraph error:', err); }
}

// --- ヒント表示 ---
function showHint() {
  try {
    const hintEl = document.getElementById('hintText');
    if (!hintEl) return;
    let text = '';
    if (questionType === 'y') text = 'ヒント: 式 y = ax + b に x を代入して計算します。';
    else if (questionType === 'a') text = 'ヒント: a = (y - b) / x を使って傾きを求めます。';
    else if (questionType === 'b') text = 'ヒント: b = y - ax を使います。';
    else if (questionType === '2pt' || questionType === 'rate') text = 'ヒント: 傾きは Δy / Δx です。';
    else text = 'ヒント: y = ax + b の形を思い出しましょう。';
    hintEl.style.display = 'block';
    hintEl.textContent = text;
  } catch (err) { console.error('showHint error:', err); }
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
  if (typeof updateWrongProblemsPanel === 'function') updateWrongProblemsPanel();
  applyCustomRange();
  generateGameQuestion();
  startTimer();
}
function retryGame() { startGame(); }

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) { clearInterval(timerInterval); return; }
    timer--; const tEl = document.getElementById("timer"); if (tEl) tEl.textContent = timer;
    if (timer <= 0) loseLife();
  }, 1000);
}
function loseLife() {
  life--; const lifeEl = document.getElementById("life"); if (lifeEl) lifeEl.textContent = life;
  timer = window.timeLimit; const tEl = document.getElementById("timer"); if (tEl) tEl.textContent = timer;
  if (life <= 0) endGame();
  else setTimeout(() => { generateGameQuestion(); focusAnswerInput(); }, 800);
}
function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  const goPanel = document.getElementById("gameOverPanel"); if (goPanel) goPanel.style.display = "block";
  const retryBtn = document.getElementById("retryBtn"); if (retryBtn) retryBtn.style.display = "inline-block";
  const checkBtn = document.getElementById("checkBtn"); if (checkBtn) checkBtn.style.display = "none";
  const graphCheckBtn = document.getElementById("graphCheckBtn"); if (graphCheckBtn) graphCheckBtn.style.display = "none";
  const graphPanel = document.getElementById("graphPanel"); if (graphPanel) graphPanel.style.display = "none";
  const tablePanel = document.getElementById("tablePanel"); if (tablePanel) tablePanel.style.display = "none";
  const qn = document.getElementById("questionNumber"); if (qn) qn.textContent = "";
  const resultSummary = document.getElementById("resultSummary");
  if (resultSummary) resultSummary.textContent = `終了！正解数: ${correctCount} / ${totalQuestions}（正答率: ${Math.round((correctCount / totalQuestions) * 100)}%）`;
}

// --- 出題ロジック ---
function generateGameQuestion() {
  if (!gameActive) return;
  if (currentQuestion >= totalQuestions) { endGame(); return; }
  currentQuestion++;
  const qnEl = document.getElementById("questionNumber"); if (qnEl) qnEl.textContent = `【第${currentQuestion}問 / 全${totalQuestions}問】`;
  hideAllAnswerUI();
  let type = currentGameQuestionType;
  if (type === "mix") { const arr = ["algebra", "graph", "table", "rate"]; type = arr[randInt(0, arr.length - 1)]; }
  if (type === "algebra") generateAlgebraQuestionImproved();
  else if (type === "graph") { const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; if (typeof generateGraphQuestion === 'function') generateGraphQuestion(true); }
  else if (type === "table") if (typeof generateTableQuestion === 'function') generateTableQuestion();
  else if (type === "rate") generateRateQuestion();
  focusAnswerInput();
}
function hideAllAnswerUI() {
  const ar = document.getElementById("answerResult"); if (ar) ar.textContent = "";
  const hint = document.getElementById("hintText"); if (hint) { hint.style.display = "none"; hint.textContent = ""; }
  ["answerInput", "answerInputA", "answerInputB", "equationInput", "slopeInput", "interceptInput"].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = "none";
  });
  const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "none";
  const gcb = document.getElementById("graphCheckBtn"); if (gcb) gcb.style.display = "none";
  const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "none";
  const tcb = document.getElementById("tableCheckBtn"); if (tcb) tcb.style.display = "none";
  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "none";
  const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = "none";
}

// ----- 改良された計算問題（グラフ描画含む）-----
function generateAlgebraQuestionImproved() {
  if (!gameActive) return;
  const range = getRanges();
  const difficulty = document.getElementById("difficulty").value || "easy";
  const pool = difficulty === "easy" ? ["y", "ab", "y"] :
    difficulty === "normal" ? ["y", "a", "b", "2pt"] :
      ["y", "a", "b", "2pt", "eq", "y"];
  questionType = pool[randInt(0, pool.length - 1)];
  let a = randInt(range.aMin, range.aMax);
  let b = randInt(range.bMin, range.bMax);
  if (difficulty === "hard" && Math.random() < 0.35) {
    a = clampDecimal(a + (Math.random() < 0.5 ? -0.5 : 0.5));
    b = clampDecimal(b + (Math.random() < 0.5 ? -0.5 : 0.5));
  }
  if (a === 0) a = (range.aMin <= 1 && range.aMax >= 1) ? 1 : (range.aMin || 1);
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
    try { drawAlgebraGraph(currentA, currentB); } catch (e) { console.error(e); }
    focusAnswerInput(); return;
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
    focusAnswerInput(); return;
  } else if (questionType === "eq") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `下のグラフを見て、一次関数の式 y = ax + b の a と b を答えてください。`;
    const aEl = document.getElementById("answerInputA"); if (aEl) aEl.style.display = "inline";
    const bEl = document.getElementById("answerInputB"); if (bEl) bEl.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
    try { drawAlgebraGraph(currentA, currentB); } catch (e) { console.error(e); }
    focusAnswerInput(); return;
  }
  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
  try { drawAlgebraGraph(currentA, currentB); } catch (e) { console.error(e); }
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
  try { drawAlgebraGraph(a, b); } catch (e) { console.error(e); }
  focusAnswerInput();
}

// --- 表問題（簡易） ---
function generateTableQuestion() {
  try {
    const range = getRanges();
    const a = randInt(range.aMin, range.aMax); const b = randInt(range.bMin, range.bMax);
    currentA = a; currentB = b;
    // 作る表: x 列と y 列、ランダムに 5 個
    const xs = [];
    for (let i = 0; i < 5; i++) xs.push(randInt(range.xMin, range.xMax));
    xs.sort((u, v) => u - v);
    const tableArea = document.getElementById('tableArea');
    if (!tableArea) return;
    let html = '<table style="width:100%; border-collapse:collapse;"><tr>';
    xs.forEach(x => html += `<th style="padding:6px; text-align:center; border:1px solid #eee;">x=${x}</th>`);
    html += '</tr><tr>';
    xs.forEach(x => html += `<td style="padding:8px; text-align:center; border:1px solid #eee;">${a * x + b}</td>`);
    html += '</tr></table>';
    tableArea.innerHTML = html;
    const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = "block";
    const tcb = document.getElementById("tableCheckBtn"); if (tcb) tcb.style.display = "inline";
    // For table check we ask random x from xs
    currentX = xs[randInt(0, xs.length - 1)];
    currentY = a * currentX + b;
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `表を見て、x = ${currentX} のときの y の値を答えなさい。`;
    const ai = document.getElementById("tableAnswerInput"); if (ai) ai.style.display = "inline";
    focusAnswerInput();
  } catch (err) { console.error('generateTableQuestion error:', err); }
}
function checkTableAnswer() {
  try {
    const ai = document.getElementById("tableAnswerInput");
    if (!ai) return;
    const v = parseNumber(ai.value);
    const res = document.getElementById("tableAnswerResult");
    if (v === null) { if (res) res.textContent = '数値を入力してください。'; return; }
    if (approxEqual(v, currentY)) {
      if (res) res.textContent = '正解！';
      correctCount++; score += 10;
    } else {
      if (res) res.textContent = `不正解。正解は ${currentY} です。`;
      wrongProblems.push({ question: document.getElementById('question')?.textContent || '', correct: currentY });
      life--;
      document.getElementById("life").textContent = life;
    }
    updateWrongProblemsPanel();
    setTimeout(() => { generateGameQuestion(); }, 700);
  } catch (err) { console.error(err); }
}

// --- グラフ問題作成（簡易） ---
function generateGraphQuestion(withPanel) {
  try {
    const range = getRanges();
    const a = randInt(range.aMin, range.aMax); const b = randInt(range.bMin, range.bMax);
    graphA = a; graphB = b; currentA = a; currentB = b;
    const gp = document.getElementById("graphPanel"); if (gp && withPanel) gp.style.display = "block";
    drawAlgebraGraph(a, b);
    // 表示設定: グラフ形式に応じた入力
    const mode = document.getElementById('graphMode')?.value || 'ab';
    if (mode === 'ab') { document.getElementById('slopeLabel').style.display = 'inline'; document.getElementById('interceptLabel').style.display = 'inline'; document.getElementById('graphCheckBtn').style.display = 'inline'; document.getElementById('equationInput').style.display = 'none'; }
    else { document.getElementById('equationInput').style.display = 'inline'; document.getElementById('graphCheckBtn').style.display = 'inline'; document.getElementById('slopeLabel').style.display = 'none'; document.getElementById('interceptLabel').style.display = 'none'; }
    questionType = 'eq';
    const qEl = document.getElementById("graphProblem"); if (qEl) qEl.textContent = 'グラフを見て a,b を答えてください。';
    focusAnswerInput();
  } catch (err) { console.error('generateGraphQuestion error:', err); }
}

// --- 判定処理 ---
function checkAnswer() {
  try {
    const ar = document.getElementById("answerResult");
    if (questionType === 'y') {
      const ai = document.getElementById("answerInput");
      const v = parseNumber(ai?.value);
      if (v === null) { if (ar) ar.textContent = '数値を入力してください。'; return; }
      if (approxEqual(v, currentY)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は ${currentY} です。`; wrongProblems.push({ question: document.getElementById('question')?.textContent || '', correct: currentY }); life--; document.getElementById("life").textContent = life; }
    } else if (questionType === 'a') {
      const ai = document.getElementById("answerInput");
      const v = parseNumber(ai?.value);
      if (v === null) { if (ar) ar.textContent = '数値を入力してください。'; return; }
      if (approxEqual(v, currentA)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は ${currentA} です。`; wrongProblems.push({ question: document.getElementById('question')?.textContent || '', correct: currentA }); life--; document.getElementById("life").textContent = life; }
    } else if (questionType === 'b') {
      const ai = document.getElementById("answerInput");
      const v = parseNumber(ai?.value);
      if (v === null) { if (ar) ar.textContent = '数値を入力してください。'; return; }
      if (approxEqual(v, currentB)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は ${currentB} です。`; wrongProblems.push({ question: document.getElementById('question')?.textContent || '', correct: currentB }); life--; document.getElementById("life").textContent = life; }
    } else if (questionType === '2pt' || questionType === 'rate') {
      const ai = document.getElementById("answerInput");
      const v = parseNumber(ai?.value);
      if (v === null) { if (ar) ar.textContent = '数値を入力してください。'; return; }
      if (approxEqual(v, currentA)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は ${currentA} です。`; wrongProblems.push({ question: document.getElementById('question')?.textContent || '', correct: currentA }); life--; document.getElementById("life").textContent = life; }
    } else if (questionType === 'ab' || questionType === 'eq') {
      // ab/eq handled by graph inputs as well, but also allow answerInputA/B
      const aIn = parseNumber(document.getElementById("answerInputA")?.value);
      const bIn = parseNumber(document.getElementById("answerInputB")?.value);
      if (aIn === null || bIn === null) { if (ar) ar.textContent = 'a, b を入力してください。'; return; }
      if (approxEqual(aIn, currentA) && approxEqual(bIn, currentB)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は a=${currentA}, b=${currentB} です。`; wrongProblems.push({ question: document.getElementById('question')?.textContent || '', correct: { a: currentA, b: currentB } }); life--; document.getElementById("life").textContent = life; }
    } else {
      if (ar) ar.textContent = '判定できません。';
    }

    document.getElementById("score").textContent = score;
    updateWrongProblemsPanel();
    if (life <= 0) endGame();
    else setTimeout(() => { generateGameQuestion(); }, 700);
  } catch (err) { console.error('checkAnswer error:', err); }
}

// --- グラフ用判定 ---
function checkGraphAnswer() {
  try {
    const mode = document.getElementById('graphMode')?.value || 'ab';
    const ar = document.getElementById("graphAnswerResult");
    if (mode === 'ab') {
      const aIn = parseNumber(document.getElementById("slopeInput")?.value || document.getElementById("answerInputA")?.value);
      const bIn = parseNumber(document.getElementById("interceptInput")?.value || document.getElementById("answerInputB")?.value);
      if (aIn === null || bIn === null) { if (ar) ar.textContent = 'a, b を入力してください'; return; }
      if (approxEqual(aIn, currentA) && approxEqual(bIn, currentB)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は a=${currentA}, b=${currentB}`; wrongProblems.push({ question: document.getElementById('graphProblem')?.textContent || '', correct: { a: currentA, b: currentB } }); life--; document.getElementById("life").textContent = life; }
    } else {
      const eq = (document.getElementById("equationInput")?.value || '').replace(/\s/g, '');
      // try parse "y=ax+b" or "ax+b"
      let m = eq.match(/y=([+-]?[0-9]*\.?[0-9]+)x([+-][0-9]*\.?[0-9]+)?/i);
      if (!m) m = eq.match(/([+-]?[0-9]*\.?[0-9]+)x([+-][0-9]*\.?[0-9]+)?/i);
      if (!m) { if (ar) ar.textContent = '式を y=ax+b の形で入力してください'; return; }
      const aIn = parseNumber(m[1]); const bIn = parseNumber(m[2] || '0');
      if (aIn === null || bIn === null) { if (ar) ar.textContent = '数値を正しく入力してください'; return; }
      if (approxEqual(aIn, currentA) && approxEqual(bIn, currentB)) { if (ar) ar.textContent = '正解！'; correctCount++; score += 10; }
      else { if (ar) ar.textContent = `不正解。正解は a=${currentA}, b=${currentB}`; wrongProblems.push({ question: document.getElementById('graphProblem')?.textContent || '', correct: { a: currentA, b: currentB } }); life--; document.getElementById("life").textContent = life; }
    }
    document.getElementById("score").textContent = score;
    updateWrongProblemsPanel();
    if (life <= 0) endGame();
    else setTimeout(() => { generateGameQuestion(); }, 700);
  } catch (err) { console.error('checkGraphAnswer error:', err); }
}

// --- 初期バインド（index.html 側の onclick でも呼べるよう関数をグローバルに） ---
window.startGame = startGame;
window.retryGame = retryGame;
window.showHint = showHint;
window.checkAnswer = checkAnswer;
window.checkGraphAnswer = checkGraphAnswer;
window.checkTableAnswer = checkTableAnswer;

// --- table check binding ---
function checkTableAnswerBinding() { checkTableAnswer(); }
window.checkTableAnswer = checkTableAnswerBinding;

// End of script.js
