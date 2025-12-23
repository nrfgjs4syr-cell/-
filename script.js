// 一次関数ゲーム - 完全修正版 script.js (上書き用)
// - 省略箇所を復元し、UI 表示制御を整理、必要な関数を全て定義してグローバル公開しています。
// - index.html の inline handlers (onclick/onchange) と整合するよう window にエクスポート済み。
// - Chart.js を使った描画 + canvas フォールバックあり。

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

// getRanges: setDifficultyRange が window.autoRange をセットする想定
function getRanges() {
  return window.autoRange || { aMin: 1, aMax: 3, bMin: -3, bMax: 3, xMin: 0, xMax: 5 };
}

// --- 回答 UI 表示制御 ---
function hideAllAnswerUI() {
  const ar = document.getElementById("answerResult"); if (ar) ar.textContent = "";
  const hint = document.getElementById("hintText"); if (hint) { hint.style.display = "none"; hint.textContent = ""; }

  ["answerInput","answerInputA","answerInputB","equationInput","slopeInput","interceptInput","tableAnswerInput"].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = "none";
  });
  ["checkBtn","graphCheckBtn","hintBtn","tableCheckBtn"].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = "none";
  });
  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "none";
  const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = "none";
  const slopeLabel = document.getElementById('slopeLabel'); if (slopeLabel) slopeLabel.style.display = 'none';
  const interceptLabel = document.getElementById('interceptLabel'); if (interceptLabel) interceptLabel.style.display = 'none';
  const gar = document.getElementById("graphAnswerResult"); if (gar) gar.textContent = "";
  const tar = document.getElementById("tableAnswerResult"); if (tar) tar.textContent = "";
}

function showUIForProblemMode(mode) {
  hideAllAnswerUI();
  const graphMode = document.getElementById('graphMode')?.value || 'ab';

  if (mode === 'algebra') {
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = 'inline';
    const aA = document.getElementById("answerInputA"); if (aA) aA.style.display = 'inline';
    const aB = document.getElementById("answerInputB"); if (aB) aB.style.display = 'inline';
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = 'inline';
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = 'inline';
  } else if (mode === 'graph') {
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = 'block';
    if (graphMode === 'ab') {
      const slopeLabel = document.getElementById('slopeLabel'); if (slopeLabel) slopeLabel.style.display = 'inline';
      const interceptLabel = document.getElementById('interceptLabel'); if (interceptLabel) interceptLabel.style.display = 'inline';
      const graphCheck = document.getElementById('graphCheckBtn'); if (graphCheck) graphCheck.style.display = 'inline';
      const sI = document.getElementById('slopeInput'); if (sI) sI.style.display = 'inline';
      const iI = document.getElementById('interceptInput'); if (iI) iI.style.display = 'inline';
    } else {
      const eq = document.getElementById('equationInput'); if (eq) eq.style.display = 'inline';
      const graphCheck = document.getElementById('graphCheckBtn'); if (graphCheck) graphCheck.style.display = 'inline';
    }
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = 'inline';
  } else if (mode === 'table') {
    const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = 'block';
    const ta = document.getElementById("tableAnswerInput"); if (ta) ta.style.display = 'inline';
    const tcb = document.getElementById("tableCheckBtn"); if (tcb) tcb.style.display = 'inline';
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = 'inline';
  } else if (mode === 'rate') {
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = 'inline';
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = 'inline';
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = 'inline';
  } else if (mode === 'mix') {
    const ids = ["answerInput","answerInputA","answerInputB","equationInput","tableAnswerInput"];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'inline'; });
    ["checkBtn","graphCheckBtn","tableCheckBtn","hintBtn"].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'inline'; });
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = 'block';
    const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = 'block';
  } else {
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = 'inline';
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = 'inline';
  }
}

// --- wrongProblems panel 更新 ---
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
    wrongProblems.forEach((p, i) => {
      const li = document.createElement('li');
      if (typeof p === 'string') li.textContent = p;
      else if (p && typeof p === 'object') li.textContent = p.question || JSON.stringify(p);
      else li.textContent = String(p);
      const btn = document.createElement('button');
      btn.textContent = '練習';
      btn.className = 'big-button';
      btn.style.marginLeft = '8px';
      btn.onclick = () => practiceWrongProblem(i);
      li.appendChild(btn);
      list.appendChild(li);
    });
  } catch (err) { console.error('updateWrongProblemsPanel error:', err); }
}
function practiceWrongProblem(idx) {
  const p = wrongProblems[idx];
  if (!p) return;
  const qEl = document.getElementById('question');
  if (qEl) qEl.textContent = `類似練習: ${p.question || String(p)}`;
  showUIForProblemMode('algebra');
  focusAnswerInput();
}

// --- input focus & Enter 判定バインド ---
function focusAnswerInput() {
  setTimeout(() => {
    const ids = ["answerInput","answerInputA","answerInputB","equationInput","slopeInput","interceptInput","tableAnswerInput"];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.style.display !== "none") { try { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { } break; }
    }
  }, 200);
}
function attachInputKeyEvents() {
  const check = () => { const cb = document.getElementById("checkBtn"); if (cb && cb.style.display !== "none") checkAnswer(); };
  const graphCheck = () => { const gcb = document.getElementById("graphCheckBtn"); if (gcb && gcb.style.display !== "none") checkGraphAnswer(); };
  ["answerInput","answerInputA","answerInputB","equationInput","slopeInput","interceptInput","tableAnswerInput"].forEach(id => {
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
  const startBtn = document.getElementById('startBtn');
  if (startBtn && !startBtn._touchBound) {
    startBtn.addEventListener('touchend', (e) => { e.preventDefault(); startBtn.click(); }, { passive: false });
    startBtn._touchBound = true;
  }
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', attachInputKeyEvents);
else attachInputKeyEvents();

// --- difficulty / ranges ---
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
  const v = Number(document.getElementById("totalQuestionsInput")?.value || totalQuestions);
  if (v >= 1) totalQuestions = v;
}

// --- draw algebra graph (Chart.js or canvas fallback) ---
function drawAlgebraGraph(a, b) {
  try {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    if (window.Chart) {
      if (graphChart) { try { graphChart.destroy(); } catch {} graphChart = null; }
      const labels = []; const data = [];
      const minX = -5, maxX = 5;
      for (let x = minX; x <= maxX; x++) { labels.push(x); data.push(a * x + b); }

      const yVals = data.slice();
      const minY = Math.min(...yVals), maxY = Math.max(...yVals);
      const rangeY = Math.max(1e-6, maxY - minY);
      let yStep = Math.max(0.5, rangeY / 20); if (rangeY > 20) yStep = Math.ceil(yStep);

      const ctx = canvas.getContext('2d');
      graphChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `y = ${a}x + ${b}`,
            data,
            borderColor: '#3578e5',
            backgroundColor: 'rgba(53,120,229,0.08)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { display: true, min: minX, max: maxX, ticks: { stepSize: 1 } },
            y: {
              display: true,
              suggestedMin: Math.floor((minY - yStep) / yStep) * yStep,
              suggestedMax: Math.ceil((maxY + yStep) / yStep) * yStep,
              ticks: { stepSize: yStep, callback: function(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); } }
            }
          },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          elements: { point: { radius: 0, hoverRadius: 0 } }
        }
      });
      return;
    }

    // canvas fallback
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(300, Math.floor(w * ratio));
    canvas.height = Math.max(200, Math.floor(h * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#f9f9f9'; ctx.fillRect(0, 0, w, h);

    const minX = -5, maxX = 5;
    const yVals = []; for (let x = minX; x <= maxX; x++) yVals.push(a * x + b);
    const minY = Math.min(...yVals), maxY = Math.max(...yVals);
    const rangeY = Math.max(1e-6, maxY - minY);
    let yStep = Math.max(0.5, rangeY / 20); if (rangeY > 20) yStep = Math.ceil(yStep);

    const ys = rangeY || 1;
    const yToPx = (yVal) => h - ((yVal - minY) / ys) * h;

    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.fillStyle = '#666'; ctx.font = '12px sans-serif';
    const startY = Math.floor(minY / yStep) * yStep;
    for (let yLine = startY; yLine <= maxY + 1e-9; yLine = Math.round((yLine + yStep) * 1000000) / 1000000) {
      const py = yToPx(yLine);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
      const label = Number.isInteger(yLine) ? String(yLine) : yLine.toFixed(1);
      ctx.fillText(label, 6, py - 4);
    }
    const y0px = yToPx(0);
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, y0px); ctx.lineTo(w, y0px); ctx.stroke();

    ctx.strokeStyle = '#3578e5'; ctx.lineWidth = 2; ctx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const xVal = minX + t * (maxX - minX);
      const yVal = a * xVal + b;
      const px = t * w;
      const py = yToPx(yVal);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } catch (err) { console.error('drawAlgebraGraph error:', err); }
}

// --- ヒント ---
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
  wrongProblems = []; try { updateWrongProblemsPanel(); } catch (e) {}
  const resultSummary = document.getElementById("resultSummary"); if (resultSummary) resultSummary.textContent = "";
  const answerResult = document.getElementById("answerResult"); if (answerResult) answerResult.textContent = "";
  const graphAnswerResult = document.getElementById("graphAnswerResult"); if (graphAnswerResult) graphAnswerResult.textContent = "";
  const tableAnswerResult = document.getElementById("tableAnswerResult"); if (tableAnswerResult) tableAnswerResult.textContent = "";
  const hintEl = document.getElementById("hintText"); if (hintEl) { hintEl.style.display = "none"; hintEl.textContent = ""; }

  setDifficultyRange(document.getElementById("difficulty")?.value || 'easy');
  life = window.lifeLimit; timer = window.timeLimit;
  const scoreEl = document.getElementById("score"); if (scoreEl) scoreEl.textContent = score;
  const lifeEl = document.getElementById("life"); if (lifeEl) lifeEl.textContent = life;
  const levelEl = document.getElementById("level"); if (levelEl) levelEl.textContent = level;
  const timerEl = document.getElementById("timer"); if (timerEl) timerEl.textContent = (typeof timer !== 'undefined' ? timer : '');

  const startBtn = document.getElementById("startBtn"); if (startBtn) startBtn.style.display = "none";
  const retryBtn = document.getElementById("retryBtn"); if (retryBtn) retryBtn.style.display = "none";
  const similarBtn = document.getElementById("similarBtn"); if (similarBtn) similarBtn.style.display = wrongProblems.length > 0 ? "inline-block" : "none";

  applyCustomRange();
  generateGameQuestion();
  try { startTimer(); } catch (e) {}
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
  gameActive = false; clearInterval(timerInterval);
  const goPanel = document.getElementById("gameOverPanel"); if (goPanel) goPanel.style.display = "block";
  const retryBtn = document.getElementById("retryBtn"); if (retryBtn) retryBtn.style.display = "inline-block";
  const checkBtn = document.getElementById("checkBtn"); if (checkBtn) checkBtn.style.display = "none";
  const graphCheckBtn = document.getElementById("graphCheckBtn"); if (graphCheckBtn) graphCheckBtn.style.display = "none";
  const graphPanel = document.getElementById("graphPanel"); if (graphPanel) graphPanel.style.display = "none";
  const tablePanel = document.getElementById("tablePanel"); if (tablePanel) tablePanel.style.display = "none";
  const qn = document.getElementById("questionNumber"); if (qn) qn.textContent = "";
  const resultSummary = document.getElementById("resultSummary");
  if (resultSummary) resultSummary.textContent = `終了！正解数: ${correctCount} / ${totalQuestions}（正答率: ${totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0}%）`;
}

// --- 出題ロジック（既定の各出題関数は上で定義済み） ---
function generateGameQuestion() {
  if (!gameActive) return;
  if (currentQuestion >= totalQuestions) { endGame(); return; }
  currentQuestion++;
  const qnEl = document.getElementById("questionNumber"); if (qnEl) qnEl.textContent = `【第${currentQuestion}問 / 全${totalQuestions}問】`;
  hideAllAnswerUI();
  let type = currentGameQuestionType;
  if (type === "mix") { const arr = ["algebra","graph","table","rate"]; type = arr[randInt(0, arr.length-1)]; }

  if (type === "algebra") generateAlgebraQuestionImproved();
  else if (type === "graph") { const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; generateGraphQuestion(true); }
  else if (type === "table") generateTableQuestion();
  else if (type === "rate") generateRateQuestion();

  focusAnswerInput();
}

// --- graphMode change handler & initial UI bind ---
function onGraphModeChange() {
  const pt = document.getElementById("problemType")?.value || currentGameQuestionType;
  if (pt === 'graph') showUIForProblemMode('graph');
}
function initUIBindings() {
  const p = document.getElementById("problemType")?.value || currentGameQuestionType;
  showUIForProblemMode(p);
  const gm = document.getElementById('graphMode'); if (gm) gm.addEventListener('change', onGraphModeChange);
  const pt = document.getElementById('problemType'); if (pt) pt.addEventListener('change', () => { onProblemTypeChange(); showUIForProblemMode(pt.value); });
  focusAnswerInput();
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initUIBindings);
else initUIBindings();

// --- グローバル公開（index.html の inline handlers 対応） ---
window.startGame = startGame;
window.retryGame = retryGame;
window.showHint = showHint;
window.checkAnswer = checkAnswer;
window.checkGraphAnswer = checkGraphAnswer;
window.checkTableAnswer = checkTableAnswer;
window.applyCustomRange = applyCustomRange;
window.setDifficultyRange = setDifficultyRange;
window.onProblemTypeChange = function() { const v = document.getElementById("problemType")?.value; if (["algebra","graph","table","rate","mix"].includes(v)) { currentGameQuestionType = v; showUIForProblemMode(v); } };
window.challengeSimilarProblem = function() { if (!wrongProblems || wrongProblems.length === 0) { alert('類似練習候補がありません。'); return; } practiceWrongProblem(0); };
window.onGraphModeChange = onGraphModeChange;

// End of script.js
