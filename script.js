// 一次関数ゲーム - 完全版 script.js
// 2025-12-23 修正版
//
// このファイルは index.html の inline handlers (onclick/onchange) と整合するよう
// 必要な関数を全て定義し、グローバルに公開しています。
// 主な修正点:
// - getRanges の定義を確実に用意（console の ReferenceError 対策）
// - 切れていた window.onProblemTypeChange の修正
// - 出題・判定関数（generateAlgebraQuestionImproved, generateGraphQuestion,
//   generateTableQuestion, generateRateQuestion, checkAnswer, checkGraphAnswer,
//   checkTableAnswer）を実装
// - Chart.js が無くても描画可能なフォールバックを保持

// --- 状態変数 ---
let currentA = 1, currentB = 0, currentX = 0, currentY = 0;
let questionType = "y"; // 'y' (y を求める), 'a' (a を求める), 'b' (b を求める)
let graphA = 1, graphB = 0, graphChart = null;
let currentGameQuestionType = "algebra"; // algebra | graph | table | rate | mix

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

// getRanges: 常に存在するように実装（設定は setDifficultyRange で上書きされる）
function getRanges() {
  return window.autoRange || { aMin: 1, aMax: 3, bMin: -3, bMax: 3, xMin: 0, xMax: 5 };
}
window.getRanges = getRanges;

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

function drawAlgebraGraph(a, b) {
  try {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;

    const minX = -5, maxX = 5;
    const labels = [];
    const data = [];

    for (let x = minX; x <= maxX; x++) {
      labels.push(x);
      data.push(a * x + b);
    }

    /* ===== Chart.js 使用 ===== */
    if (window.Chart) {
      if (graphChart) {
        try { graphChart.destroy(); } catch {}
        graphChart = null;
      }

      const ctx = canvas.getContext('2d');
      graphChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: `y = ${a}x + ${b}`,
              data,
              borderColor: '#3578e5',
              fill: false,
              pointRadius: 0,
              tension: 0
{
  type: 'scatter',
  data: [{ x: 0, y: 0 }],
  pointRadius: 5,
  pointBackgroundColor: '#e53935',
  pointBorderColor: '#e53935'
}

            },
            {
              // ★ 原点 (0,0)
              {
  type: 'scatter',
  data: [{ x: 0, y: 0 }],
  pointRadius: 5,
  pointBackgroundColor: '#e53935',
  pointBorderColor: '#e53935'
}

            }
          ]
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              min: minX,
              max: maxX,
              ticks: { stepSize: 1 },
              grid: {
                color: c => c.tick.value === 0 ? '#000' : '#ddd',
                lineWidth: c => c.tick.value === 0 ? 2 : 1
              }
            },
            y: {
              ticks: { stepSize: 1 },
              grid: {
                color: c => c.tick.value === 0 ? '#000' : '#ddd',
                lineWidth: c => c.tick.value === 0 ? 2 : 1
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            originLabel: {
              afterDraw(chart) {
                const { ctx, scales } = chart;
                const x0 = scales.x.getPixelForValue(0);
                const y0 = scales.y.getPixelForValue(0);
                ctx.save();
                ctx.fillStyle = '#e53935';
                ctx.font = '14px sans-serif';
                ctx.fillText('(0,0)', x0 + 6, y0 - 6);
                ctx.restore();
border: {
  color: '#000',
  width: 2
}

              }
            }
          }
        }
      });
      return;
    }

    /* ===== fallback canvas ===== */
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, w, h);

    const yVals = data;
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const xToPx = x => ((x - minX) / (maxX - minX)) * w;
    const yToPx = y => h - ((y - minY) / (maxY - minY)) * h;

    // x軸
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, yToPx(0));
    ctx.lineTo(w, yToPx(0));
    ctx.stroke();

    // y軸
    ctx.beginPath();
    ctx.moveTo(xToPx(0), 0);
    ctx.lineTo(xToPx(0), h);
    ctx.stroke();

    // 原点
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(xToPx(0), yToPx(0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('(0,0)', xToPx(0) + 6, yToPx(0) - 6);

    // 直線
    ctx.strokeStyle = '#3578e5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = minX + i;
      const px = xToPx(x);
      const py = yToPx(data[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } catch (err) {
    console.error('drawAlgebraGraph error:', err);
  }
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

// --- 出題ロジック ---
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

// --- 各種出題関数実装 ---
// 代入して y を出す問題 / a や b を求めさせる問題
function generateAlgebraQuestionImproved() {
  try {
    const ranges = getRanges();
    // pick integers for a and b within ranges, avoid zero a if asking for 'a'
    let a = randInt(ranges.aMin, ranges.aMax);
    if (a === 0) a = ranges.aMin !== 0 ? ranges.aMin : 1;
    const b = randInt(ranges.bMin, ranges.bMax);
    const x = randInt(ranges.xMin, ranges.xMax);
    currentA = a; currentB = b; currentX = x; currentY = a * x + b;

    // decide which unknown to ask for
    const modes = ['y','a','b'];
    questionType = modes[randInt(0, modes.length-1)];

    const qEl = document.getElementById('question');
    if (!qEl) return;
    if (questionType === 'y') {
      qEl.textContent = `次の式のとき、x = ${x} における y の値を求めよ。\ny = ${a}x + ${b}`;
    } else if (questionType === 'a') {
      // to ask a, provide x, y and b -> solve a = (y-b)/x (avoid x=0)
      const x2 = x === 0 ? (x + 1) : x;
      currentX = x2;
      currentY = a * x2 + b;
      qEl.textContent = `次の値から傾き a を求めよ。\nx = ${x2},\ny = ${currentY},\nb = ${b}\n(小数は小数第2位四捨五入)`;
    } else { // 'b'
      qEl.textContent = `次の値から切片 b を求めよ。\nx = ${x},\ny = ${currentY},\na = ${a}`;
    }

    showUIForProblemMode('algebra');
    // clear inputs
    ['answerInput','answerInputA','answerInputB'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  } catch (err) { console.error('generateAlgebraQuestionImproved error:', err); }
}

// グラフ問題: グラフを表示して a,b を答えさせる or 式を書かせる
function generateGraphQuestion(showGraph) {
  try {
    const ranges = getRanges();
    graphA = randInt(ranges.aMin, ranges.aMax);
    graphB = randInt(ranges.bMin, ranges.bMax);
    // small chance to pick fractional slopes? keep integers for simplicity
    graphA = graphA === 0 ? 1 : graphA;
    const qEl = document.getElementById('graphProblem');
    if (qEl) qEl.textContent = `表示された直線の式を答えなさい。`;

    drawAlgebraGraph(graphA, graphB);
    const gm = document.getElementById('graphMode')?.value || 'ab';
    showUIForProblemMode('graph');
    // clear graph inputs
    ['slopeInput','interceptInput','equationInput'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  } catch (err) { console.error('generateGraphQuestion error:', err); }
}

// 表問題: x 列を与えて y を求める形式
function generateTableQuestion() {
  try {
    const ranges = getRanges();
    const a = randInt(ranges.aMin, ranges.aMax);
    const b = randInt(ranges.bMin, ranges.bMax);
    currentA = a; currentB = b;
    // create a small table of 4 x values
    const xs = [];
    const startX = randInt(Math.max(ranges.xMin, -3), Math.min(ranges.xMax, 3));
    for (let i = 0; i < 4; i++) xs.push(startX + i);
    const tableArea = document.getElementById('tableArea');
    if (!tableArea) return;
    // choose which column the player should answer for (random)
    const targetIdx = randInt(0, xs.length - 1);
    currentX = xs[targetIdx];
    currentY = a * currentX + b;

let html = `<table style="margin:0 auto; border-collapse:collapse;">`;

// --- x 行（絶対に ? を入れない）---
html += `<tr><th style="padding:6px;border:1px solid #ddd;">x</th>`;
xs.forEach(x => {
  html += `<td style="padding:6px;border:1px solid #ddd;">${x}</td>`;
});
html += `</tr>`;

// --- y 行（targetIdx だけ ?）---
html += `<tr><th style="padding:6px;border:1px solid #ddd;">y</th>`;
xs.forEach((x, i) => {
  const yv = a * x + b;
  if (i === targetIdx) {
   html += `<td class="question-cell">？</td>`;
  } else {
    html += `<td style="padding:6px;border:1px solid #ddd;">${yv}</td>`;
  }
});
html += `</tr></table>`;

// ★ここで1回だけ代入する


    tableArea.innerHTML = html;
    const qEl = document.getElementById('question');
    if (qEl) qEl.textContent = `表の中の y の値を読んで問題に答えなさい。\n（下の入力欄には指定された x における y を入力します）\n求める x = ${currentX}`;
    showUIForProblemMode('table');
    const ta = document.getElementById('tableAnswerInput'); if (ta) ta.value = "";
  } catch (err) { console.error('generateTableQuestion error:', err); }
}

// 変化の割合（傾き）問題
function generateRateQuestion() {
  try {
    const ranges = getRanges();
    const a = randInt(ranges.aMin, ranges.aMax);
    const b = randInt(ranges.bMin, ranges.bMax);
    // pick two distinct x's
    const x1 = randInt(Math.max(ranges.xMin, -10), Math.min(ranges.xMax, 10));
    let x2 = x1 + randInt(1, 4);
    if (x2 === x1) x2 = x1 + 1;
    const y1 = a * x1 + b;
    const y2 = a * x2 + b;
    currentA = a; currentB = b; currentX = x1; currentY = y1;
    const qEl = document.getElementById('question');
    if (qEl) qEl.textContent = `次の二点の変化の割合（傾き）を求めよ。\n点1: (${x1}, ${y1})\n点2: (${x2}, ${y2})\n（小数は必要に応じて小数第2位を四捨五入）`;
    showUIForProblemMode('rate');
    // store correct slope in currentA (as canonical)
    currentA = a;
    const ai = document.getElementById('answerInput'); if (ai) ai.value = "";
  } catch (err) { console.error('generateRateQuestion error:', err); }
}

// --- 判定ロジック ---
function recordWrong(questionText, extra = {}) {
  wrongProblems.push(Object.assign({ question: questionText }, extra));
  updateWrongProblemsPanel();
}

function checkAnswer() {
  try {
    const ar = document.getElementById("answerResult");
    const inputY = parseNumber(document.getElementById("answerInput")?.value);
    const inputA = parseNumber(document.getElementById("answerInputA")?.value);
    const inputB = parseNumber(document.getElementById("answerInputB")?.value);

    let ok = false;
    if (questionType === 'y') {
      if (inputY === null) { if (ar) ar.textContent = '答えを入力してください。'; return; }
      ok = approxEqual(inputY, currentY) || inputY === currentY;
    } else if (questionType === 'a') {
      if (inputA === null) { if (ar) ar.textContent = '傾き a を入力してください。'; return; }
      ok = approxEqual(inputA, currentA) || inputA === currentA;
    } else if (questionType === 'b') {
      if (inputB === null) { if (ar) ar.textContent = '切片 b を入力してください。'; return; }
      ok = approxEqual(inputB, currentB) || inputB === currentB;
    } else {
      // fallback: if any of the specific fields match
      if (inputY !== null && (approxEqual(inputY, currentY) || inputY === currentY)) ok = true;
      if (inputA !== null && (approxEqual(inputA, currentA) || inputA === currentA)) ok = true;
      if (inputB !== null && (approxEqual(inputB, currentB) || inputB === currentB)) ok = true;
    }

    if (ok) {
      score += 10; correctCount++;
      if (ar) ar.textContent = '正解！';
    } else {
      life--; if (ar) ar.textContent = `不正解。正しい答え: ${questionType === 'y' ? currentY : questionType === 'a' ? currentA : currentB}`;
      recordWrong(document.getElementById('question')?.textContent || '問題', { a: currentA, b: currentB, x: currentX, y: currentY });
    }
    const scoreEl = document.getElementById("score"); if (scoreEl) scoreEl.textContent = score;
    const lifeEl = document.getElementById("life"); if (lifeEl) lifeEl.textContent = life;

    // 次の問題へ
    setTimeout(() => {
      if (life <= 0) endGame();
      else generateGameQuestion();
    }, 800);
  } catch (err) { console.error('checkAnswer error:', err); }
}

function parseEquationString(eqStr) {
  // 簡易パーサ:  y = ax + b, ax + b, a x + b, etc.
  // returns {a, b} or null
  try {
    if (!eqStr || typeof eqStr !== 'string') return null;
    // remove spaces
    let s = eqStr.replace(/\s+/g, '').toLowerCase();
    // drop leading "y="
    if (s.startsWith('y=')) s = s.slice(2);
    // handle forms like "3x+2" or "-x-1" or "2x" or "x+1"
    const match = s.match(/^([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)?$/);
    if (!match) {
      // maybe constant function like "5" or "x"
      if (/^[+-]?\d+(\.\d+)?$/.test(s)) return { a: 0, b: Number(s) };
      // maybe only "x"
      if (s === 'x') return { a: 1, b: 0 };
      return null;
    }
    let aStr = match[1];
    let bStr = match[2] || '';
    if (aStr === '' || aStr === '+') aStr = '1';
    if (aStr === '-') aStr = '-1';
    const a = Number(aStr);
    const b = bStr ? Number(bStr) : 0;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { a, b };
  } catch (err) { return null; }
}

function checkGraphAnswer() {
  try {
    const ar = document.getElementById("graphAnswerResult");
    const gm = document.getElementById('graphMode')?.value || 'ab';
    if (gm === 'ab') {
      const ia = parseNumber(document.getElementById('slopeInput')?.value);
      const ib = parseNumber(document.getElementById('interceptInput')?.value);
      if (ia === null || ib === null) { if (ar) ar.textContent = '傾きと切片を両方入力してください。'; return; }
      if (approxEqual(ia, graphA) && approxEqual(ib, graphB)) {
        score += 10; correctCount++; if (ar) ar.textContent = '正解！';
      } else {
        life--; if (ar) ar.textContent = `不正解。正しい式: y = ${graphA}x + ${graphB}`;
        recordWrong(document.getElementById('graphProblem')?.textContent || 'グラフ問題', { a: graphA, b: graphB });
      }
    } else {
      // eq mode: parse equation string
      const eqs = document.getElementById('equationInput')?.value;
      const parsed = parseEquationString(eqs);
      if (!parsed) { if (ar) ar.textContent = '式が認識できません。例: y = 2x + 3'; return; }
      if (approxEqual(parsed.a, graphA) && approxEqual(parsed.b, graphB)) {
        score += 10; correctCount++; if (ar) ar.textContent = '正解！';
      } else {
        life--; if (ar) ar.textContent = `不正解。正しい式: y = ${graphA}x + ${graphB}`;
        recordWrong(document.getElementById('graphProblem')?.textContent || 'グラフ問題', { a: graphA, b: graphB });
      }
    }
    const scoreEl = document.getElementById("score"); if (scoreEl) scoreEl.textContent = score;
    const lifeEl = document.getElementById("life"); if (lifeEl) lifeEl.textContent = life;
    setTimeout(() => {
      if (life <= 0) endGame();
      else generateGameQuestion();
    }, 800);
  } catch (err) { console.error('checkGraphAnswer error:', err); }
}

function checkTableAnswer() {
  try {
    const ar = document.getElementById("tableAnswerResult");
    const val = parseNumber(document.getElementById("tableAnswerInput")?.value);
    if (val === null) { if (ar) ar.textContent = '答えを入力してください。'; return; }
    if (approxEqual(val, currentY) || val === currentY) {
      score += 10; correctCount++; if (ar) ar.textContent = '正解！';
    } else {
      life--; if (ar) ar.textContent = `不正解。正しい答え: ${currentY}`;
      recordWrong(document.getElementById('question')?.textContent || '表問題', { a: currentA, b: currentB, x: currentX, y: currentY });
    }
    const scoreEl = document.getElementById("score"); if (scoreEl) scoreEl.textContent = score;
    const lifeEl = document.getElementById("life"); if (lifeEl) lifeEl.textContent = life;
    setTimeout(() => {
      if (life <= 0) endGame();
      else generateGameQuestion();
    }, 800);
  } catch (err) { console.error('checkTableAnswer error:', err); }
}

// --- graphMode change handler & initial UI bind ---
function onGraphModeChange() {
  const pt = document.getElementById("problemType")?.value || currentGameQuestionType;
  if (pt === 'graph') showUIForProblemMode('graph');
}
function onProblemTypeChange() {
  const v = document.getElementById("problemType")?.value;
  if (["algebra","graph","table","rate","mix"].includes(v)) {
    currentGameQuestionType = v;
    showUIForProblemMode(v);
  }
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
window.onProblemTypeChange = onProblemTypeChange;
window.challengeSimilarProblem = function() { if (!wrongProblems || wrongProblems.length === 0) { alert('類似練習候補がありません。'); return; } practiceWrongProblem(0); };
window.onGraphModeChange = onGraphModeChange;

// End of script.js
