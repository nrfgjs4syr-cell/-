// 一次関数ゲーム - 修正版スクリプト（endGame 修正 + イベントバインド追加）
// これまでの機能（計算問題拡張、グラフ拡大、変化の割合など）を含みます。

// --- 状態変数 ---
let currentA = 1, currentB = 0, currentX = 0, currentY = 0;
let questionType = "y"; // y/a/b/ab/2pt/eq/rate
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
  updateWrongProblemsPanel();
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
  else setTimeout(generateGameQuestion, 800);
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
  else if (type === "graph") { document.getElementById("graphPanel").style.display = "block"; generateGraphQuestion(true); }
  else if (type === "table") generateTableQuestion();
  else if (type === "rate") generateRateQuestion();
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
    drawAlgebraGraph(currentA, currentB);
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
    return;
  } else if (questionType === "eq") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `下のグラフを見て、一次関数の式 y = ax + b の a と b を答えてください。`;
    const aEl = document.getElementById("answerInputA"); if (aEl) aEl.style.display = "inline";
    const bEl = document.getElementById("answerInputB"); if (bEl) bEl.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const hb = document.getElementById("hintBtn"); if (hb) hb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
    drawAlgebraGraph(currentA, currentB);
    return;
  }

  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
  drawAlgebraGraph(currentA, currentB);
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
  drawAlgebraGraph(a, b);
}

// ----- 判定（計算 / rate 等） -----
function checkAnswer() {
  if (!gameActive) return;
  if (currentGameQuestionType === "graph" && document.getElementById("graphPanel").style.display === "block") {
    checkGraphAnswer(); return;
  }
  if (currentGameQuestionType === "table") return;

  const difficulty = document.getElementById("difficulty").value || "easy";
  const tol = difficulty === "easy" ? 0.01 : difficulty === "normal" ? 0.005 : 0.001;
  const resultDiv = document.getElementById("answerResult");

  const aInputVisible = document.getElementById("answerInputA").style.display !== "none";
  const bInputVisible = document.getElementById("answerInputB").style.display !== "none";
  if (aInputVisible && bInputVisible) {
    const userA = Number(document.getElementById("answerInputA").value);
    const userB = Number(document.getElementById("answerInputB").value);
    if (approxEqual(userA, currentA, tol) && (currentB === null ? true : approxEqual(userB, currentB, tol))) {
      handleCorrect();
    } else {
      if (resultDiv) { resultDiv.textContent = `不正解… 正しい答えは a=${currentA}${currentB !== null ? `、b=${currentB}` : ""} です。`; resultDiv.style.color = "red"; }
      addWrongProblem("ab", currentA, currentB, null, null);
      loseLife();
    }
    return;
  }

  const raw = document.getElementById("answerInput").value;
  const userVal = Number(raw);
  if (raw === "" || isNaN(userVal)) {
    const ar = document.getElementById("answerResult"); if (ar) ar.textContent = "数値を入力してください。";
    return;
  }

  let correctVal = null;
  if (questionType === "y") correctVal = currentY;
  else if (questionType === "a") correctVal = currentA;
  else if (questionType === "b") correctVal = currentB;
  else if (questionType === "2pt") correctVal = currentA;
  else if (questionType === "rate") correctVal = currentA;

  if (correctVal === null || correctVal === undefined) {
    const ar = document.getElementById("answerResult"); if (ar) ar.textContent = "内部エラー：正解が未設定です。";
    return;
  }

  if (approxEqual(userVal, correctVal, tol)) handleCorrect();
  else {
    const ar = document.getElementById("answerResult"); if (ar) { ar.textContent = `不正解… 正しい答えは ${correctVal} です。`; ar.style.color = "red"; }
    addWrongProblem(questionType, currentA, currentB, currentX, currentY);
    loseLife();
  }
}

function approxEqual(a, b, tol) { return Math.abs(Number(a) - Number(b)) <= tol; }
function handleCorrect() {
  const rd = document.getElementById("answerResult");
  if (rd) { rd.textContent = "正解！ +10点"; rd.style.color = "green"; }
  score += 10; correctCount++; const sEl = document.getElementById("score"); if (sEl) sEl.textContent = score;
  if (score % 50 === 0) levelUp();
  timer = window.timeLimit; const tEl = document.getElementById("timer"); if (tEl) tEl.textContent = timer;
  setTimeout(generateGameQuestion, 800);
}

function showHint() {
  const hint = document.getElementById("hintText");
  let text = "ヒント：";
  if (questionType === "y") text += `y = ax + b に x = ${currentX} を代入して計算します。（a = ${currentA}, b = ${currentB}）`;
  else if (questionType === "a") text += `式 y = ax + b より a = (y - b) / x を計算します。`;
  else if (questionType === "b") text += `式 y = ax + b より b = y - ax を計算します。`;
  else if (questionType === "ab") text += `グラフの傾きを視覚的に確認してください。切片は x=0 の y 値です。`;
  else if (questionType === "2pt") text += `傾きは (y2 - y1) / (x2 - x1) です。`;
  else if (questionType === "rate") text += `変化の割合は Δy / Δx = (y2 - y1) / (x2 - x1) で求められます。`;
  else text += `まず式に代入してみましょう。`;
  if (hint) { hint.textContent = text; hint.style.display = "block"; }
}

// ----- グラフ描画（Chart.js） -----
function drawAlgebraGraph(a, b) {
  graphA = a; graphB = b;
  const range = getRanges();
  const xVals = []; const yVals = [];
  for (let x = range.xMin; x <= range.xMax; x++) { xVals.push(x); yVals.push(a * x + b); }

  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  if (graphChart) graphChart.destroy();
  const ctx = canvas.getContext('2d');
  graphChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xVals,
      datasets: [{
        label: '',
        data: yVals,
        borderColor: 'red',
        backgroundColor: 'rgba(255,99,132,0.18)',
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: 'blue',
        borderWidth: 3,
        tension: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'x軸' }, grid: { color: 'rgba(0,0,0,0.12)' } },
        y: { title: { display: true, text: 'y軸' }, grid: { color: 'rgba(0,0,0,0.12)' } }
      },
      animation: false
    },
    plugins: [{
      id: 'arrow-plugin',
      afterDraw: chart => {
        const ctx = chart.ctx;
        const area = chart.chartArea;
        const xZero = chart.scales.x.getPixelForValue(0);
        const yZero = chart.scales.y.getPixelForValue(0);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(xZero, yZero); ctx.lineTo(area.right - 15, yZero); ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(area.right - 15, yZero); ctx.lineTo(area.right - 25, yZero - 7); ctx.lineTo(area.right - 25, yZero + 7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(xZero, yZero); ctx.lineTo(xZero, area.top + 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xZero, area.top + 15); ctx.lineTo(xZero - 7, area.top + 25); ctx.lineTo(xZero + 7, area.top + 25); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }]
  });
}

function generateGraphQuestion(isGameMode = false) {
  document.getElementById("graphPanel").style.display = "block";
  const range = getRanges();
  graphA = randInt(range.aMin, range.aMax); if (graphA === 0) graphA = 1;
  graphB = randInt(range.bMin, range.bMax);
  drawAlgebraGraph(graphA, graphB);

  const graphMode = document.getElementById("graphMode").value || "ab";
  const gp = document.getElementById("graphProblem"); if (gp) gp.textContent = `下のグラフを見て答えてください。`;
  if (graphMode === "ab") {
    const sl = document.getElementById("slopeLabel"); if (sl) sl.style.display = "inline";
    const il = document.getElementById("interceptLabel"); if (il) il.style.display = "inline";
    const si = document.getElementById("slopeInput"); if (si) si.value = "";
    const ii = document.getElementById("interceptInput"); if (ii) ii.value = "";
    const gcb = document.getElementById("graphCheckBtn"); if (gcb) gcb.style.display = "inline";
    const eq = document.getElementById("equationInput"); if (eq) eq.style.display = "none";
  } else {
    const sl = document.getElementById("slopeLabel"); if (sl) sl.style.display = "none";
    const il = document.getElementById("interceptLabel"); if (il) il.style.display = "none";
    const eq = document.getElementById("equationInput"); if (eq) { eq.style.display = "inline"; eq.value = ""; }
    const gcb = document.getElementById("graphCheckBtn"); if (gcb) gcb.style.display = "inline";
  }
}

// ----- graph 判定 -----
function checkGraphAnswer() {
  const graphMode = document.getElementById("graphMode").value || "ab";
  const resultDiv = document.getElementById("graphAnswerResult");
  if (graphMode === "ab") {
    const userA = Number(document.getElementById("slopeInput").value);
    const userB = Number(document.getElementById("interceptInput").value);
    if (userA === graphA && userB === graphB) {
      if (resultDiv) { resultDiv.textContent = "正解！ +10点"; resultDiv.style.color = "green"; }
      score += 10; correctCount++; const sEl = document.getElementById("score"); if (sEl) sEl.textContent = score;
      setTimeout(generateGameQuestion, 800);
    } else {
      if (resultDiv) { resultDiv.textContent = `不正解… 正しい答えは 傾き(a)=${graphA}、切片(b)=${graphB} です。`; resultDiv.style.color = "red"; }
      addWrongProblem("graph", graphA, graphB, null, null); loseLife();
    }
    return;
  }

  const userRaw = (document.getElementById("equationInput").value || "").trim();
  const userNorm = normalizeEquationString(userRaw);
  const correctNorm = normalizeEquationString(formatFunctionString(graphA, graphB));
  if (userNorm && userNorm === correctNorm) {
    if (resultDiv) { resultDiv.textContent = "正解！ +10点"; resultDiv.style.color = "green"; }
    score += 10; correctCount++; const sEl = document.getElementById("score"); if (sEl) sEl.textContent = score;
    setTimeout(generateGameQuestion, 800);
  } else {
    if (resultDiv) { resultDiv.textContent = `不正解… 正しい式は ${formatFunctionString(graphA, graphB)} です。`; resultDiv.style.color = "red"; }
    addWrongProblem("graph", graphA, graphB, null, null); loseLife();
  }
}

function normalizeEquationString(s) {
  if (!s) return "";
  let t = s.toLowerCase();
  t = t.replace(/[　\s]/g, "");
  if (t.startsWith("y=")) t = t.slice(2);
  const m = t.match(/^([+-]?\d*\.?\d*)x([+-]?\d+\.?\d*)?$/);
  if (m) {
    let a = m[1]; if (a === "" || a === "+") a = "1"; if (a === "-") a = "-1";
    let b = m[2] || "+0";
    return `${Number(a)}x${b}`;
  }
  return t;
}
function formatFunctionString(a,b) {
  if (b === 0) return `y=${a}x`;
  if (b > 0) return `y=${a}x+${b}`;
  return `y=${a}x${b}`;
}

// ----- 表問題 -----
function generateTableQuestion() {
  const range = getRanges();
  currentA = randInt(range.aMin, range.aMax);
  currentB = randInt(range.bMin, range.bMax);
  let xVals = [];
  while (xVals.length < 3) {
    let x = randInt(range.xMin, range.xMax);
    if (!xVals.includes(x)) xVals.push(x);
  }
  xVals.sort((a,b)=>a-b);
  const blankIdx = randInt(0,2);
  let yVals = xVals.map((x,i)=> i===blankIdx ? null : currentA * x + currentB);
  const answerY = currentA * xVals[blankIdx] + currentB;
  let tableHtml = `<table style="margin:auto;border-collapse:collapse;"><tr><th style="background:#e6e8f7;padding:8px 12px;border:1px solid #aaa;">x</th>`;
  xVals.forEach(x=> tableHtml += `<td style="border:1px solid #aaa;padding:8px 12px;">${x}</td>`);
  tableHtml += `</tr><tr><th style="background:#e6e8f7;padding:8px 12px;border:1px solid #aaa;">y</th>`;
  yVals.forEach((y,i)=> tableHtml += `<td style="border:1px solid #aaa;padding:8px 12px;">${i===blankIdx?'<b>？</b>':y}</td>`);
  tableHtml += `</tr></table>`;
  const ta = document.getElementById("tableArea"); if (ta) ta.innerHTML = tableHtml;
  const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = "block";
  const tain = document.getElementById("tableAnswerInput"); if (tain) tain.value = "";
  const tcb = document.getElementById("tableCheckBtn"); if (tcb) { tcb.style.display = "inline-block"; tcb.onclick = ()=> checkTableAnswer(answerY); }
  const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
  drawAlgebraGraph(currentA, currentB);
}

function checkTableAnswer(ansY) {
  const userY = Number(document.getElementById("tableAnswerInput").value);
  const rd = document.getElementById("tableAnswerResult");
  if (userY === ansY) {
    if (rd) { rd.textContent = "正解！ +10点"; rd.style.color = "green"; }
    score += 10; correctCount++; const sEl = document.getElementById("score"); if (sEl) sEl.textContent = score;
    setTimeout(generateGameQuestion, 800);
  } else {
    if (rd) { rd.textContent = `不正解… 正しい答えは ${ansY} です。`; rd.style.color = "red"; }
    addWrongProblem("table", currentA, currentB, null, ansY); loseLife();
  }
}

// ----- 類似問題機能 -----
function addWrongProblem(type,a,b,x,y) {
  wrongProblems.push({type,a,b,x,y});
  updateWrongProblemsPanel();
  const similarBtn = document.getElementById("similarBtn"); if (similarBtn) similarBtn.style.display = wrongProblems.length > 0 ? "inline-block" : "none";
}

function challengeSimilarProblem() {
  if (wrongProblems.length === 0) return;
  const base = wrongProblems[randInt(0, wrongProblems.length-1)];
  const range = getRanges();
  let a = clamp(base.a + randInt(-1,1), range.aMin, range.aMax);
  let b = clamp(base.b + randInt(-1,1), range.bMin, range.bMax);
  let x = typeof base.x === "number" ? clamp(base.x + randInt(-1,1), range.xMin, range.xMax) : randInt(range.xMin, range.xMax);
  let y = a * x + b;
  showSimilarProblem(base.type, a, b, x, y);
}

function showSimilarProblem(type,a,b,x,y) {
  currentA = a; currentB = b; currentX = x; currentY = y; questionType = type;
  if (type === "table") {
    let xVals=[]; while(xVals.length<3){ let xx=randInt(getRanges().xMin,getRanges().xMax); if(!xVals.includes(xx)) xVals.push(xx); }
    xVals.sort((p,q)=>p-q);
    const blankIdx = randInt(0,2);
    const yVals = xVals.map((xx,i)=> i===blankIdx?null:a*xx+b);
    const answerY = a * xVals[blankIdx] + b;
    let tableHtml = `<table style="margin:auto;border-collapse:collapse;"><tr><th style="background:#e6e8f7;padding:8px 12px;border:1px solid #aaa;">x</th>`;
    xVals.forEach(xx=> tableHtml += `<td style="border:1px solid #aaa;padding:8px 12px;">${xx}</td>`);
    tableHtml += `</tr><tr><th style="background:#e6e8f7;padding:8px 12px;border:1px solid #aaa;">y</th>`;
    yVals.forEach((yv,i)=> tableHtml += `<td style="border:1px solid #aaa;padding:8px 12px;">${i===blankIdx?'<b>？</b>':yv}</td>`);
    tableHtml += `</tr></table>`;
    const ta = document.getElementById("tableArea"); if (ta) ta.innerHTML = tableHtml;
    const tp = document.getElementById("tablePanel"); if (tp) tp.style.display = "block";
    const tain = document.getElementById("tableAnswerInput"); if (tain) tain.value = "";
    const tcb = document.getElementById("tableCheckBtn"); if (tcb) { tcb.style.display = "inline-block"; tcb.onclick = ()=> checkTableAnswer(answerY); }
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
    drawAlgebraGraph(a,b);
    return;
  }
  if (type === "graph") {
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block";
    drawAlgebraGraph(a,b);
    const gm = document.getElementById("graphMode").value || "ab";
    if (gm === "ab") {
      const sl = document.getElementById("slopeLabel"); if (sl) sl.style.display = "inline";
      const il = document.getElementById("interceptLabel"); if (il) il.style.display = "inline";
      const gcb = document.getElementById("graphCheckBtn"); if (gcb) gcb.style.display = "inline";
    } else {
      const eq = document.getElementById("equationInput"); if (eq) eq.style.display = "inline";
      const gcb = document.getElementById("graphCheckBtn"); if (gcb) gcb.style.display = "inline";
    }
    return;
  }
  if (type === "y") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `一次関数のとき、x = ${x} の y の値は？`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline"; const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "a") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `x = ${x} のとき、y = ${y} となる一次関数の傾き a はいくらですか？`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline"; const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "b") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `x = ${x} のとき、y = ${y} となる一次関数の切片 b はいくらですか？`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline"; const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "ab") {
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `一次関数の a と b を答えてください。`;
    const aEl = document.getElementById("answerInputA"); if (aEl) aEl.style.display = "inline"; const bEl = document.getElementById("answerInputB"); if (bEl) bEl.style.display = "inline";
    const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "rate") {
    let x1 = randInt(getRanges().xMin, getRanges().xMax);
    let x2 = randInt(getRanges().xMin, getRanges().xMax);
    while (x2 === x1) x2 = randInt(getRanges().xMin, getRanges().xMax);
    const y1 = a * x1 + b; const y2 = a * x2 + b;
    currentA = (y2 - y1) / (x2 - x1);
    const qEl = document.getElementById("question"); if (qEl) qEl.textContent = `点 (${x1}, ${y1}) と (${x2}, ${y2}) の変化の割合（Δy/Δx）を求めなさい。`;
    const ai = document.getElementById("answerInput"); if (ai) ai.style.display = "inline"; const cb = document.getElementById("checkBtn"); if (cb) cb.style.display = "inline";
    const gp = document.getElementById("graphPanel"); if (gp) gp.style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
}

// ----- 類似パネル更新 -----
function updateWrongProblemsPanel() {
  const panel = document.getElementById("similarProblemsPanel");
  const list = document.getElementById("similarProblemsList");
  if (wrongProblems.length === 0) { if (panel) panel.style.display = "none"; if (list) list.innerHTML = ""; return; }
  if (panel) panel.style.display = "block";
  let html = "";
  wrongProblems.forEach(p=>{
    if (p.type === "graph") html += `<li>グラフ: a=${p.a}, b=${p.b}</li>`;
    else if (p.type === "table") html += `<li>表: a=${p.a}, b=${p.b}, 答=${p.y}</li>`;
    else if (p.type === "y") html += `<li>y: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    else if (p.type === "a") html += `<li>a: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    else if (p.type === "b") html += `<li>b: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    else if (p.type === "ab") html += `<li>ab: a=${p.a}, b=${p.b}</li>`;
    else if (p.type === "rate") html += `<li>変化の割合: a=${p.a}, b=${p.b}</li>`;
    else html += `<li>その他: a=${p.a}, b=${p.b}</li>`;
  });
  if (list) list.innerHTML = html;
}

// ----- イベントリスナを確実に接続する（DOMContentLoaded） -----
function attachListeners() {
  try {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.removeAttribute('onclick');
      startBtn.addEventListener('click', () => { if (typeof startGame === 'function') startGame(); else console.error('startGame is not defined'); });
    }

    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.removeAttribute('onclick');
      retryBtn.addEventListener('click', () => { if (typeof retryGame === 'function') retryGame(); });
    }

    const checkBtn = document.getElementById('checkBtn');
    if (checkBtn) {
      checkBtn.removeAttribute('onclick');
      checkBtn.addEventListener('click', () => { if (typeof checkAnswer === 'function') checkAnswer(); });
    }

    const graphCheckBtn = document.getElementById('graphCheckBtn');
    if (graphCheckBtn) {
      graphCheckBtn.removeAttribute('onclick');
      graphCheckBtn.addEventListener('click', () => { if (typeof checkGraphAnswer === 'function') checkGraphAnswer(); });
    }

    const tableCheckBtn = document.getElementById('tableCheckBtn');
    if (tableCheckBtn) {
      tableCheckBtn.removeAttribute('onclick');
      tableCheckBtn.addEventListener('click', () => { if (typeof checkTableAnswer === 'function') checkTableAnswer(); });
    }

    // 保険: グラフ形式や問題タイプの select の change イベント
    const problemType = document.getElementById('problemType');
    if (problemType) problemType.addEventListener('change', () => { onProblemTypeChange(); });

    console.log('Event listeners attached.');
  } catch (err) {
    console.error('attachListeners error:', err);
  }
}

window.addEventListener('DOMContentLoaded', attachListeners);
