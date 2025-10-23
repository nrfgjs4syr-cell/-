// 一次関数ゲーム - 完全版スクリプト
// 設定・状態
let currentA = 1, currentB = 0, currentX = 0, currentY = 0;
let questionType = "y"; // 質問サブタイプ（y/a/b/ab/2pt/eq）
let graphA = 1, graphB = 0, graphChart = null;
let currentGameQuestionType = "algebra";

let score = 0, life = 3, level = 1, timer = 30, timerInterval = null;
let gameActive = false;
let totalQuestions = 10, currentQuestion = 0, correctCount = 0;
let wrongProblems = [];

// 基本ユーティリティ
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function clampDecimal(val) { return Math.round(val * 10) / 10; }

// 難易度レンジ設定
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
  if (["algebra","graph","table","mix"].includes(v)) currentGameQuestionType = v;
}

// ゲーム制御
function startGame() {
  score = 0; level = 1; currentQuestion = 0; correctCount = 0; gameActive = true;
  setDifficultyRange(document.getElementById("difficulty").value);
  life = window.lifeLimit; timer = window.timeLimit;
  document.getElementById("score").textContent = score;
  document.getElementById("life").textContent = life;
  document.getElementById("level").textContent = level;
  document.getElementById("timer").textContent = timer;
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("retryBtn").style.display = "none";
  document.getElementById("similarBtn").style.display = wrongProblems.length > 0 ? "inline-block" : "none";
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
    timer--; document.getElementById("timer").textContent = timer;
    if(timer <= 0) loseLife();
  }, 1000);
}

function loseLife() {
  life--; document.getElementById("life").textContent = life;
  timer = window.timeLimit; document.getElementById("timer").textContent = timer;
  if (life <= 0) endGame();
  else setTimeout(generateGameQuestion, 800);
}

function endGame() {
  gameActive = false; clearInterval(timerInterval);
  document.getElementById("gameOverPanel").style.display = "block";
  document.getElementById("retryBtn").style.display = "inline-block";
  document.getElementById("checkBtn").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("graphPanel").style.display = "none";
  document.getElementById("tablePanel").style.display = "none";
  document.getElementById("questionNumber").textContent = "";
  document.getElementById("resultSummary").textContent = `ゲーム終了：正解 ${correctCount} / ${totalQuestions}（${Math.round((correctCount/totalQuestions)*100)}%）`;
}

// 問題生成
function generateGameQuestion() {
  if (!gameActive) return;
  if (currentQuestion >= totalQuestions) { endGame(); return; }

  currentQuestion++;
  document.getElementById("questionNumber").textContent = `【第${currentQuestion}問 / 全${totalQuestions}問】`;

  // hide all
  hideAllAnswerUI();

  let type = currentGameQuestionType;
  if (type === "mix") {
    const arr = ["algebra","graph","table"];
    type = arr[randInt(0, arr.length-1)];
  }

  if (type === "algebra") generateAlgebraQuestionImproved();
  else if (type === "graph") {
    document.getElementById("graphPanel").style.display = "block";
    generateGraphQuestion(true);
  } else if (type === "table") generateTableQuestion();
}

function hideAllAnswerUI() {
  document.getElementById("answerResult").textContent = "";
  document.getElementById("hintText").style.display = "none";
  document.getElementById("hintText").textContent = "";
  // inputs
  ["answerInput","answerInputA","answerInputB","equationInput","slopeInput","interceptInput"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document.getElementById("checkBtn").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("hintBtn").style.display = "none";
  document.getElementById("tableCheckBtn")?.style.display = "none";
  document.getElementById("graphPanel").style.display = "none";
  document.getElementById("tablePanel").style.display = "none";
}

// ----- 改善された計算問題（algebra） -----
function generateAlgebraQuestionImproved() {
  if (!gameActive) return;
  const range = getRanges();
  const difficulty = document.getElementById("difficulty").value || "easy";

  // サブタイプの選択
  const pool = difficulty === "easy" ? ["y","ab","y"] :
               difficulty === "normal" ? ["y","a","b","2pt"] :
               ["y","a","b","2pt","eq","y"];
  questionType = pool[randInt(0, pool.length-1)];

  // 係数生成
  let a = randInt(range.aMin, range.aMax);
  let b = randInt(range.bMin, range.bMax);
  if (difficulty === "hard" && Math.random() < 0.35) {
    a = clampDecimal(a + (Math.random()<0.5?-0.5:0.5));
    b = clampDecimal(b + (Math.random()<0.5?-0.5:0.5));
  }
  if (a === 0) a = (range.aMin <= 1 && range.aMax >=1) ? 1 : (range.aMin || 1);

  currentA = a; currentB = b;

  // サブタイプごとの問題文生成
  if (questionType === "y") {
    currentX = randInt(range.xMin, range.xMax);
    currentY = currentA * currentX + currentB;
    document.getElementById("question").textContent = `一次関数 y = ax + b のとき、x = ${currentX} の y の値はいくつですか？`;
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("hintBtn").style.display = "inline";
  } else if (questionType === "a") {
    currentX = randInt(range.xMin || -5, range.xMax || 5);
    currentY = currentA * currentX + currentB;
    document.getElementById("question").textContent = `x = ${currentX} のとき、y = ${currentY} となる一次関数の傾き a を求めなさい。`;
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("hintBtn").style.display = "inline";
  } else if (questionType === "b") {
    currentX = randInt(range.xMin || -5, range.xMax || 5);
    currentY = currentA * currentX + currentB;
    document.getElementById("question").textContent = `x = ${currentX} のとき、y = ${currentY} となる一次関数の切片 b を求めなさい。`;
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("hintBtn").style.display = "inline";
  } else if (questionType === "ab") {
    // a,b を問う問題：グラフ表示して a,b を入力
    document.getElementById("question").textContent = `次の一次関数の a（傾き）と b（切片）を答えてください。`;
    document.getElementById("answerInputA").style.display = "inline";
    document.getElementById("answerInputB").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("hintBtn").style.display = "inline";
    document.getElementById("graphPanel").style.display = "block";
    drawAlgebraGraph(currentA, currentB);
    return;
  } else if (questionType === "2pt") {
    // 2点から傾きを求める
    let x1 = randInt(range.xMin, range.xMax);
    let x2 = randInt(range.xMin, range.xMax);
    while (x2 === x1) x2 = randInt(range.xMin, range.xMax);
    const y1 = currentA * x1 + currentB;
    const y2 = currentA * x2 + currentB;
    currentA = (y2 - y1) / (x2 - x1); // 正解用に上書き
    document.getElementById("question").textContent = `点 (${x1}, ${y1}) と (${x2}, ${y2}) を通る直線の傾き a を求めなさい。`;
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("hintBtn").style.display = "inline";
    return;
  } else if (questionType === "eq") {
    // 式を答える（ここでは a,b を入力してもらう形式に落とし込む）
    document.getElementById("question").textContent = `下のグラフを見て、一次関数の式 y = ax + b の a と b を答えてください。`;
    document.getElementById("answerInputA").style.display = "inline";
    document.getElementById("answerInputB").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("hintBtn").style.display = "inline";
    document.getElementById("graphPanel").style.display = "block";
    drawAlgebraGraph(currentA, currentB);
    return;
  }

  // 共通：グラフを示す（視覚的補助）
  document.getElementById("graphPanel").style.display = "block";
  drawAlgebraGraph(currentA, currentB);
}

// 判定 - 計算問題
function checkAnswer() {
  if (!gameActive) return;
  // グラフモードの判定は checkGraphAnswer() に委ねる
  if (currentGameQuestionType === "graph" && document.getElementById("graphPanel").style.display === "block") {
    checkGraphAnswer(); return;
  }
  if (currentGameQuestionType === "table") return; // table は専用処理

  const difficulty = document.getElementById("difficulty").value || "easy";
  const tol = difficulty === "easy" ? 0.01 : difficulty === "normal" ? 0.005 : 0.001;
  const resultDiv = document.getElementById("answerResult");

  // a,b 両方入力タイプ
  const aInputVisible = document.getElementById("answerInputA").style.display !== "none";
  const bInputVisible = document.getElementById("answerInputB").style.display !== "none";
  if (aInputVisible && bInputVisible) {
    const userA = Number(document.getElementById("answerInputA").value);
    const userB = Number(document.getElementById("answerInputB").value);
    if (approxEqual(userA, currentA, tol) && approxEqual(userB, currentB, tol)) {
      handleCorrect();
    } else {
      resultDiv.textContent = `不正解… 正しい答えは a=${currentA}、b=${currentB} です。`;
      resultDiv.style.color = "red";
      addWrongProblem("ab", currentA, currentB, null, null);
      loseLife();
    }
    return;
  }

  // 単一数値タイプ
  const raw = document.getElementById("answerInput").value;
  const userVal = Number(raw);
  if (raw === "" || isNaN(userVal)) {
    document.getElementById("answerResult").textContent = "数値を入力してください。";
    return;
  }

  let correctVal = null;
  if (questionType === "y") correctVal = currentY;
  else if (questionType === "a") correctVal = currentA;
  else if (questionType === "b") correctVal = currentB;
  else if (questionType === "2pt") correctVal = currentA;

  if (correctVal === null || correctVal === undefined) {
    document.getElementById("answerResult").textContent = "内部エラー：正解が未設定です。";
    return;
  }

  if (approxEqual(userVal, correctVal, tol)) handleCorrect();
  else {
    document.getElementById("answerResult").textContent = `不正解… 正しい答えは ${correctVal} です。`;
    document.getElementById("answerResult").style.color = "red";
    addWrongProblem(questionType, currentA, currentB, currentX, currentY);
    loseLife();
  }
}

function approxEqual(a, b, tol) { return Math.abs(Number(a) - Number(b)) <= tol; }

function handleCorrect() {
  const rd = document.getElementById("answerResult");
  rd.textContent = "正解！ +10点"; rd.style.color = "green";
  score += 10; correctCount++; document.getElementById("score").textContent = score;
  if (score % 50 === 0) levelUp();
  timer = window.timeLimit; document.getElementById("timer").textContent = timer;
  setTimeout(generateGameQuestion, 800);
}

// ヒント表示
function showHint() {
  const hint = document.getElementById("hintText");
  let text = "ヒント：";
  if (questionType === "y") text += `y = ax + b に x = ${currentX} を代入して計算します。（a = ${currentA}, b = ${currentB}）`;
  else if (questionType === "a") text += `式 y = ax + b より a = (y - b) / x を計算します。`;
  else if (questionType === "b") text += `式 y = ax + b より b = y - ax を計算します。`;
  else if (questionType === "ab") text += `グラフの傾きを視覚的に確認してください。切片は x=0 の y 値です。`;
  else if (questionType === "2pt") text += `傾きは (y2 - y1) / (x2 - x1) です。`;
  else text += `まず式に代入してみましょう。`;
  hint.textContent = text; hint.style.display = "block";
}

// ----- グラフ描画と判定（graphMode 対応） -----
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
        // x arrow
        ctx.beginPath(); ctx.moveTo(xZero, yZero); ctx.lineTo(area.right - 15, yZero); ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(area.right - 15, yZero); ctx.lineTo(area.right - 25, yZero - 7); ctx.lineTo(area.right - 25, yZero + 7); ctx.closePath(); ctx.fill();
        // y arrow
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

  // 入力UI の切替（graphMode）
  const graphMode = document.getElementById("graphMode").value || "ab";
  document.getElementById("graphProblem").textContent = `下のグラフを見て答えてください。`;
  if (graphMode === "ab") {
    document.getElementById("slopeLabel").style.display = "inline";
    document.getElementById("interceptLabel").style.display = "inline";
    document.getElementById("slopeInput").value = "";
    document.getElementById("interceptInput").value = "";
    document.getElementById("graphCheckBtn").style.display = "inline";
    document.getElementById("equationInput").style.display = "none";
  } else {
    document.getElementById("slopeLabel").style.display = "none";
    document.getElementById("interceptLabel").style.display = "none";
    document.getElementById("equationInput").style.display = "inline";
    document.getElementById("equationInput").value = "";
    document.getElementById("graphCheckBtn").style.display = "inline";
  }
}

// graph 判定（a,b or 式）
function checkGraphAnswer() {
  const graphMode = document.getElementById("graphMode").value || "ab";
  const resultDiv = document.getElementById("graphAnswerResult");
  if (graphMode === "ab") {
    const userA = Number(document.getElementById("slopeInput").value);
    const userB = Number(document.getElementById("interceptInput").value);
    if (userA === graphA && userB === graphB) {
      resultDiv.textContent = "正解！ +10点"; resultDiv.style.color = "green";
      score += 10; correctCount++; document.getElementById("score").textContent = score;
      setTimeout(generateGameQuestion, 800);
    } else {
      resultDiv.textContent = `不正解… 正しい答えは 傾き(a)=${graphA}、切片(b)=${graphB} です。`; resultDiv.style.color = "red";
      addWrongProblem("graph", graphA, graphB, null, null); loseLife();
    }
    return;
  }

  // 式入力の正規化比較
  const userRaw = (document.getElementById("equationInput").value || "").trim();
  const userNorm = normalizeEquationString(userRaw);
  const correctNorm = normalizeEquationString(formatFunctionString(graphA, graphB));
  if (userNorm && userNorm === correctNorm) {
    resultDiv.textContent = "正解！ +10点"; resultDiv.style.color = "green";
    score += 10; correctCount++; document.getElementById("score").textContent = score;
    setTimeout(generateGameQuestion, 800);
  } else {
    resultDiv.textContent = `不正解… 正しい式は ${formatFunctionString(graphA, graphB)} です。`; resultDiv.style.color = "red";
    addWrongProblem("graph", graphA, graphB, null, null); loseLife();
  }
}

// 式の正規化（単純な a,b の抽出）
function normalizeEquationString(s) {
  if (!s) return "";
  let t = s.toLowerCase();
  t = t.replace(/[　\s]/g, ""); // 全角/半角空白削除
  if (t.startsWith("y=")) t = t.slice(2);
  // x の係数を取得
  const m = t.match(/^([+-]?\d*\.?\d*)x([+-]?\d+\.?\d*)?$/);
  if (m) {
    let a = m[1]; if (a === "" || a === "+") a = "1"; if (a === "-") a = "-1";
    let b = m[2] || "+0";
    return `${Number(a)}x${b}`;
  }
  // fallback: return compact string
  return t;
}
function formatFunctionString(a,b) {
  if (b === 0) return `y=${a}x`;
  if (b > 0) return `y=${a}x+${b}`;
  return `y=${a}x${b}`; // b includes sign
}

// ----- 表問題（既存ロジック） -----
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
  document.getElementById("tableArea").innerHTML = tableHtml;
  document.getElementById("tablePanel").style.display = "block";
  document.getElementById("tableAnswerInput").value = "";
  document.getElementById("tableCheckBtn").style.display = "inline-block";
  document.getElementById("tableCheckBtn").onclick = ()=> checkTableAnswer(answerY);
  // show graph as visual aid
  document.getElementById("graphPanel").style.display = "block";
  drawAlgebraGraph(currentA, currentB);
}

function checkTableAnswer(ansY) {
  const userY = Number(document.getElementById("tableAnswerInput").value);
  const rd = document.getElementById("tableAnswerResult");
  if (userY === ansY) {
    rd.textContent = "正解！ +10点"; rd.style.color = "green";
    score += 10; correctCount++; document.getElementById("score").textContent = score;
    setTimeout(generateGameQuestion, 800);
  } else {
    rd.textContent = `不正解… 正しい答えは ${ansY} です。`; rd.style.color = "red";
    addWrongProblem("table", currentA, currentB, null, ansY); loseLife();
  }
}

// ----- 類似問題機能等 -----
function addWrongProblem(type,a,b,x,y) {
  wrongProblems.push({type,a,b,x,y});
  updateWrongProblemsPanel();
  document.getElementById("similarBtn").style.display = wrongProblems.length > 0 ? "inline-block" : "none";
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
    // reuse table logic with given a,b
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
    document.getElementById("tableArea").innerHTML = tableHtml;
    document.getElementById("tablePanel").style.display = "block";
    document.getElementById("tableAnswerInput").value = "";
    document.getElementById("tableCheckBtn").style.display = "inline-block";
    document.getElementById("tableCheckBtn").onclick = ()=> checkTableAnswer(answerY);
    document.getElementById("graphPanel").style.display = "block";
    drawAlgebraGraph(a,b);
    return;
  }
  if (type === "graph") {
    document.getElementById("graphPanel").style.display = "block";
    drawAlgebraGraph(a,b);
    const gm = document.getElementById("graphMode").value || "ab";
    if (gm === "ab") {
      document.getElementById("slopeLabel").style.display = "inline";
      document.getElementById("interceptLabel").style.display = "inline";
      document.getElementById("graphCheckBtn").style.display = "inline";
    } else {
      document.getElementById("equationInput").style.display = "inline";
      document.getElementById("graphCheckBtn").style.display = "inline";
    }
    return;
  }
  // algebra 系の類似問題を表示
  if (type === "y") {
    document.getElementById("question").textContent = `一次関数のとき、x = ${x} の y の値は？`;
    document.getElementById("answerInput").style.display = "inline"; document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("graphPanel").style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "a") {
    document.getElementById("question").textContent = `x = ${x} のとき、y = ${y} となる一次関数の傾き a はいくらですか？`;
    document.getElementById("answerInput").style.display = "inline"; document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("graphPanel").style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "b") {
    document.getElementById("question").textContent = `x = ${x} のとき、y = ${y} となる一次関数の切片 b はいくらですか？`;
    document.getElementById("answerInput").style.display = "inline"; document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("graphPanel").style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
  if (type === "ab") {
    document.getElementById("question").textContent = `一次関数の a と b を答えてください。`;
    document.getElementById("answerInputA").style.display = "inline"; document.getElementById("answerInputB").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
    document.getElementById("graphPanel").style.display = "block"; drawAlgebraGraph(a,b);
    return;
  }
}

// 類似パネル更新
function updateWrongProblemsPanel() {
  const panel = document.getElementById("similarProblemsPanel");
  const list = document.getElementById("similarProblemsList");
  if (wrongProblems.length === 0) { panel.style.display = "none"; list.innerHTML = ""; return; }
  panel.style.display = "block";
  let html = "";
  wrongProblems.forEach(p=>{
    if (p.type === "graph") html += `<li>グラフ: a=${p.a}, b=${p.b}</li>`;
    else if (p.type === "table") html += `<li>表: a=${p.a}, b=${p.b}, 答=${p.y}</li>`;
    else if (p.type === "y") html += `<li>y: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    else if (p.type === "a") html += `<li>a: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    else if (p.type === "b") html += `<li>b: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    else if (p.type === "ab") html += `<li>ab: a=${p.a}, b=${p.b}</li>`;
    else html += `<li>その他: a=${p.a}, b=${p.b}</li>`;
  });
  list.innerHTML = html;
}
