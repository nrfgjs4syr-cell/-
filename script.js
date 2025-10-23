let currentA, currentB, currentX, currentY;
let questionType = "y";
let graphA, graphB, graphChart;
let currentGameQuestionType = "algebra";

let score = 0;
let life = 3;
let level = 1;
let timer = 30;
let timerInterval = null;
let gameActive = false;

let totalQuestions = 10;
let currentQuestion = 0;
let correctCount = 0;

let wrongProblems = [];

// 難易度ごとのライフと時間上限
function getLifeLimitByDifficulty(difficulty) {
  if (difficulty === "easy") {
    return 5;
  } else if (difficulty === "normal") {
    return 4;
  } else {
    return 3;
  }
}
function getTimeLimitByDifficulty(difficulty) {
  if (difficulty === "easy") {
    return 45;
  } else if (difficulty === "normal") {
    return 60; // 普通：60秒
  } else {
    return 40; // 難しい：40秒
  }
}

function setDifficultyRange(difficulty) {
  // 難易度ごとの自動範囲
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
  let tq = Number(document.getElementById("totalQuestionsInput").value);
  if (tq >= 1) totalQuestions = tq;
}

function getRanges() {
  return window.autoRange;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function onProblemTypeChange() {
  const val = document.getElementById("problemType").value;
  if (val === "algebra" || val === "graph" || val === "table" || val === "mix") {
    currentGameQuestionType = val;
  }
}

function startGame() {
  score = 0;
  level = 1;
  gameActive = true;
  currentQuestion = 0;
  correctCount = 0;
  setDifficultyRange(document.getElementById("difficulty").value);
  life = window.lifeLimit;
  timer = window.timeLimit;
  document.getElementById("score").textContent = score;
  document.getElementById("life").textContent = life;
  document.getElementById("level").textContent = level;
  document.getElementById("timer").textContent = timer;
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("gameOverPanel").style.display = "none";
  document.getElementById("retryBtn").style.display = "none";
  document.getElementById("similarBtn").style.display = wrongProblems.length > 0 ? "inline" : "none";
  updateWrongProblemsPanel();
  applyCustomRange();
  generateGameQuestion();
  startTimer();
}

function retryGame() {
  startGame();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) {
      clearInterval(timerInterval);
      return;
    }
    timer--;
    document.getElementById("timer").textContent = timer;
    if (timer <= 0) {
      loseLife();
    }
  }, 1000);
}

function loseLife() {
  life--;
  document.getElementById("life").textContent = life;
  timer = window.timeLimit;
  document.getElementById("timer").textContent = timer;
  if (life <= 0) {
    endGame();
  } else {
    setTimeout(generateGameQuestion, 1000);
  }
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  document.getElementById("gameOverPanel").style.display = "block";
  document.getElementById("retryBtn").style.display = "inline";
  document.getElementById("checkBtn").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("graphPanel").style.display = "none";
  document.getElementById("tablePanel").style.display = "none";
  document.getElementById("questionNumber").textContent = "";
  document.getElementById("resultSummary").textContent =
    `終了！正解数: ${correctCount} / ${totalQuestions}（正答率: ${Math.round((correctCount/totalQuestions)*100)}%）`;
}

function generateGameQuestion() {
  if (!gameActive) return;
  if (currentQuestion >= totalQuestions) {
    endGame();
    return;
  }

  currentQuestion++;
  document.getElementById("questionNumber").textContent = `【第${currentQuestion}問 / 全${totalQuestions}問】`;

  // hide all answer UI
  document.getElementById("answerResult").textContent = "";
  document.getElementById("graphAnswerResult").textContent = "";
  document.getElementById("answerInput").style.display = "none";
  document.getElementById("answerInputA").style.display = "none";
  document.getElementById("answerInputB").style.display = "none";
  document.getElementById("checkBtn").style.display = "none";
  document.getElementById("graphPanel").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("tablePanel").style.display = "none";
  document.getElementById("tableCheckBtn").style.display = "none";
  document.getElementById("resultSummary").textContent = "";

  let type = currentGameQuestionType;
  if (type === "mix") {
    // algebra / graph / table ランダム
    const arr = ["algebra", "graph", "table"];
    type = arr[randInt(0, arr.length - 1)];
  }

  if (type === "algebra") {
    generateAlgebraQuestion();
  } else if (type === "graph") {
    document.getElementById("graphPanel").style.display = "block";
    generateGraphQuestion(true);
  } else if (type === "table") {
    generateTableQuestion();
  }
}

function generateAlgebraQuestion() {
  if (!gameActive) return;
  const range = getRanges();
  currentA = randInt(range.aMin, range.aMax);
  currentB = randInt(range.bMin, range.bMax);
  currentX = randInt(range.xMin, range.xMax);
  currentY = currentA * currentX + currentB;

  const difficulty = document.getElementById("difficulty") ? document.getElementById("difficulty").value : "easy";
  if (difficulty === "easy") {
    questionType = "ab";
    // 例の式表示を削除しました
    document.getElementById("question").textContent = `一次関数の式「y = ax + b」のa（傾き）とb（切片）を答えてください。`;
    document.getElementById("answerInput").style.display = "none";
    document.getElementById("answerInputA").style.display = "inline";
    document.getElementById("answerInputB").style.display = "inline";
  } else {
    const types = ["y", "a", "b"];
    questionType = types[randInt(0, types.length - 1)];
    let questionText = "";
    if (questionType === "y") {
      questionText = `一次関数のとき、x = ${currentX} の y の値は？`;
      document.getElementById("answerInput").placeholder = "yの値を入力";
    } else if (questionType === "a") {
      questionText = `x = ${currentX} のとき、y = ${currentY} となる一次関数の傾き a の値は？`;
      document.getElementById("answerInput").placeholder = "傾きを入力";
    } else if (questionType === "b") {
      questionText = `x = ${currentX} のとき、y = ${currentY} となる一次関数の切片 b の値は？`;
      document.getElementById("answerInput").placeholder = "切片を入力";
    }
    document.getElementById("question").textContent = questionText;
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("answerInputA").style.display = "none";
    document.getElementById("answerInputB").style.display = "none";
  }
  document.getElementById("answerInput").value = "";
  document.getElementById("answerInputA").value = "";
  document.getElementById("answerInputB").value = "";
  document.getElementById("answerResult").textContent = "";
  document.getElementById("checkBtn").style.display = "inline";

  // hide graph answer UI for non-graph mode
  document.getElementById("graphPanel").style.display = "block";
  document.getElementById("graphProblem").textContent =
    `下のグラフを見て答えてください。`;
  drawAlgebraGraph(currentA, currentB);
  document.getElementById("slopeLabel").style.display = "none";
  document.getElementById("interceptLabel").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("graphAnswerResult").textContent = "";
}

function generateTableQuestion() {
  // 問題: x,y の値の組を表にして、y=? の空欄を1つ作る。空欄を埋めさせる
  const range = getRanges();
  currentA = randInt(range.aMin, range.aMax);
  currentB = randInt(range.bMin, range.bMax);

  // x値3つ
  let xVals = [];
  while (xVals.length < 3) {
    let x = randInt(range.xMin, range.xMax);
    if (!xVals.includes(x)) xVals.push(x);
  }
  xVals.sort((a, b) => a - b);

  // 空欄にするindex
  let blankIdx = randInt(0, 2);
  let yVals = xVals.map((x, i) => i === blankIdx ? null : currentA * x + currentB);
  let answerY = currentA * xVals[blankIdx] + currentB;

  // 表生成
  let tableHtml = `<table><tr><th>x</th>`;
  xVals.forEach(x => tableHtml += `<td>${x}</td>`);
  tableHtml += `</tr><tr><th>y</th>`;
  yVals.forEach((y, i) => {
    if (i === blankIdx) tableHtml += `<td><b>？</b></td>`;
    else tableHtml += `<td>${y}</td>`;
  });
  tableHtml += "</tr></table>";

  document.getElementById("question").textContent = `次の表の「？」に入るyの値を答えてください。`;
  document.getElementById("tableArea").innerHTML = tableHtml;
  document.getElementById("tablePanel").style.display = "block";
  document.getElementById("tableProblem").textContent = "";
  document.getElementById("tableAnswerInput").value = "";
  document.getElementById("tableAnswerResult").textContent = "";
  document.getElementById("tableCheckBtn").style.display = "inline";
  // 使い回し用
  document.getElementById("tableCheckBtn").onclick = () => {
    checkTableAnswer(answerY);
  }

  // hide graph answer UI for non-graph mode
  document.getElementById("graphPanel").style.display = "block";
  document.getElementById("graphProblem").textContent = `下のグラフを見て答えてください。`;
  drawAlgebraGraph(currentA, currentB);
  document.getElementById("slopeLabel").style.display = "none";
  document.getElementById("interceptLabel").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("graphAnswerResult").textContent = "";
}

function checkTableAnswer(ansY) {
  const userY = Number(document.getElementById("tableAnswerInput").value);
  const resultDiv = document.getElementById("tableAnswerResult");
  if (userY === ansY) {
    resultDiv.textContent = "正解！ +10点";
    resultDiv.style.color = "green";
    score += 10;
    correctCount++;
    document.getElementById("score").textContent = score;
    if (score % 50 === 0) levelUp();
    setTimeout(generateGameQuestion, 1000);
  } else {
    resultDiv.textContent = `不正解… 正しい答えは ${ansY} です。 -1ライフ`;
    resultDiv.style.color = "red";
    addWrongProblem("table", currentA, currentB, null, ansY);
    loseLife();
  }
}

function drawAlgebraGraph(a, b) {
  // canvas の親コンテナの高さに合わせて大きく表示する
  const container = document.querySelector('.graph-container');
  if (container) {
    // container の高さは CSS で指定しているのでそのままにします（レスポンシブ）
    // ただし必要なら動的に変更可能:
    // container.style.height = '480px';
  }

  graphA = a;
  graphB = b;

  const range = getRanges();
  let xValues = [];
  let yValues = [];
  for (let x = range.xMin; x <= range.xMax; x++) {
    xValues.push(x);
    yValues.push(a * x + b);
  }
  const canvas = document.getElementById('graphCanvas');
  // 明示的に canvas の幅/高さは CSS の親に従わせる（Chart.js の maintainAspectRatio:false と合わせる）
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  if (graphChart) graphChart.destroy();
  const ctx = canvas.getContext('2d');
  graphChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xValues,
      datasets: [{
        label: '',
        data: yValues,
        borderColor: 'red',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: 'blue',
        borderWidth: 4,
        tension: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ← canvas の親要素に合わせて伸縮する
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'x軸', font: { size: 16 } },
          grid: { color: 'rgba(0,0,0,0.15)' },
          ticks: { color: 'black', font: { size: 14 } }
        },
        y: {
          title: { display: true, text: 'y軸', font: { size: 16 } },
          grid: { color: 'rgba(0,0,0,0.15)' },
          ticks: { color: 'black', font: { size: 14 } }
        }
      },
      animation: false
    },
    plugins: [{
      id: 'arrow-plugin',
      afterDraw: chart => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const xZero = chart.scales.x.getPixelForValue(0);
        const yZero = chart.scales.y.getPixelForValue(0);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xZero, yZero);
        ctx.lineTo(chartArea.right - 15, yZero);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(chartArea.right - 15, yZero);
        ctx.lineTo(chartArea.right - 25, yZero - 7);
        ctx.lineTo(chartArea.right - 25, yZero + 7);
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xZero, yZero);
        ctx.lineTo(chartArea.left + 15, yZero);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(chartArea.left + 15, yZero);
        ctx.lineTo(chartArea.left + 25, yZero - 7);
        ctx.lineTo(chartArea.left + 25, yZero + 7);
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xZero, yZero);
        ctx.lineTo(xZero, chartArea.top + 15);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xZero, chartArea.top + 15);
        ctx.lineTo(xZero - 7, chartArea.top + 25);
        ctx.lineTo(xZero + 7, chartArea.top + 25);
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xZero, yZero);
        ctx.lineTo(xZero, chartArea.bottom - 15);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xZero, chartArea.bottom - 15);
        ctx.lineTo(xZero - 7, chartArea.bottom - 25);
        ctx.lineTo(xZero + 7, chartArea.bottom - 25);
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();

        ctx.restore();
      }
    }]
  });
}

function checkAnswer() {
  if (!gameActive) return;
  if (currentGameQuestionType === "graph" && document.getElementById("graphPanel").style.display === "block") {
    checkGraphAnswer();
    return;
  }
  if (currentGameQuestionType === "table") {
    // 表問題は専用のanswer欄で判定
    return;
  }
  const difficulty = document.getElementById("difficulty") ? document.getElementById("difficulty").value : "easy";
  const resultDiv = document.getElementById("answerResult");
  let isCorrect = false;

  if (difficulty === "easy" && questionType === "ab") {
    const userA = Number(document.getElementById("answerInputA").value);
    const userB = Number(document.getElementById("answerInputB").value);
    isCorrect = (userA === currentA && userB === currentB);
    if (isCorrect) {
      resultDiv.textContent = "正解！ +10点";
      resultDiv.style.color = "green";
      score += 10;
      correctCount++;
      document.getElementById("score").textContent = score;
      if (score % 50 === 0) levelUp();
    } else {
      resultDiv.textContent = `不正解… 正しい答えは a=${currentA}、b=${currentB} です。 -1ライフ`;
      resultDiv.style.color = "red";
      addWrongProblem(questionType, currentA, currentB, currentX, currentY);
      loseLife();
      return;
    }
  } else {
    const userAns = Number(document.getElementById("answerInput").value);
    let correctAns = "";
    let ansLabel = "";
    if (questionType === "y") {
      isCorrect = (userAns === currentY);
      correctAns = currentY;
      ansLabel = "y";
    } else if (questionType === "a") {
      isCorrect = (userAns === currentA);
      correctAns = currentA;
      ansLabel = "傾き a";
    } else if (questionType === "b") {
      isCorrect = (userAns === currentB);
      correctAns = currentB;
      ansLabel = "切片 b";
    }
    if (isCorrect) {
      resultDiv.textContent = "正解！ +10点";
      resultDiv.style.color = "green";
      score += 10;
      correctCount++;
      document.getElementById("score").textContent = score;
      if (score % 50 === 0) levelUp();
    } else {
      resultDiv.textContent = `不正解… 正しい答えは ${ansLabel} = ${correctAns} です。 -1ライフ`;
      resultDiv.style.color = "red";
      addWrongProblem(questionType, currentA, currentB, currentX, currentY);
      loseLife();
      return;
    }
  }
  if (gameActive) {
    timer = window.timeLimit;
    document.getElementById("timer").textContent = timer;
    setTimeout(generateGameQuestion, 1000);
  }
}

function levelUp() {
  level++;
  document.getElementById("level").textContent = level;
  if (level >= 3) {
    document.getElementById("difficulty").value = "hard";
  } else if (level === 2) {
    document.getElementById("difficulty").value = "normal";
  } else {
    document.getElementById("difficulty").value = "easy";
  }
  setDifficultyRange(document.getElementById("difficulty").value);
}

function generateGraphQuestion(isGameMode = false) {
  document.getElementById("graphPanel").style.display = "block";
  document.getElementById("slopeLabel").style.display = "inline";
  document.getElementById("interceptLabel").style.display = "inline";
  const range = getRanges();
  graphA = randInt(range.aMin, range.aMax);
  if (graphA === 0) graphA = 1;
  graphB = randInt(range.bMin, range.bMax);

  let xValues = [];
  let yValues = [];
  for (let x = range.xMin; x <= range.xMax; x++) {
    xValues.push(x);
    yValues.push(graphA * x + graphB);
  }

  // draw using the main drawAlgebraGraph to get large canvas behavior
  drawAlgebraGraph(graphA, graphB);

  document.getElementById("question").textContent = "";
  document.getElementById("graphProblem").textContent =
    `下のグラフを見て答えてください。`;

  document.getElementById("slopeInput").value = "";
  document.getElementById("interceptInput").value = "";
  document.getElementById("graphAnswerResult").textContent = "";
  document.getElementById("graphCheckBtn").style.display = "inline";
}

function checkGraphAnswer() {
  const userSlope = Number(document.getElementById("slopeInput").value);
  const userIntercept = Number(document.getElementById("interceptInput").value);
  const resultDiv = document.getElementById("graphAnswerResult");
  if (userSlope === graphA && userIntercept === graphB) {
    resultDiv.textContent = "正解！ +10点";
    correctCount++;
    score += 10;
    document.getElementById("score").textContent = score;
    if (score % 50 === 0) levelUp();
    timer = window.timeLimit;
    document.getElementById("timer").textContent = timer;
    setTimeout(generateGameQuestion, 1000);
  } else {
    resultDiv.textContent = `不正解… 正しい答えは 傾き(a)=${graphA}、切片(b)=${graphB} です。 -1ライフ`;
    resultDiv.style.color = "red";
    addWrongProblem("graph", graphA, graphB, null, null);
    loseLife();
  }
}

// --- 類似問題機能 ---
function addWrongProblem(type, a, b, x, y) {
  wrongProblems.push({type, a, b, x, y});
  updateWrongProblemsPanel();
  if (wrongProblems.length > 0) {
    document.getElementById("similarBtn").style.display = "inline";
  }
}

function challengeSimilarProblem() {
  if (wrongProblems.length === 0) return;
  const base = wrongProblems[Math.floor(Math.random() * wrongProblems.length)];
  const range = getRanges();
  let a = clamp(base.a + randInt(-1, 1), range.aMin, range.aMax);
  let b = clamp(base.b + randInt(-1, 1), range.bMin, range.bMax);
  let x = typeof base.x === "number" ? clamp(base.x + randInt(-1, 1), range.xMin, range.xMax) : randInt(range.xMin, range.xMax);
  let y = a * x + b;
  let type = base.type;

  showSimilarProblem(type, a, b, x, y);
}
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
function showSimilarProblem(type, a, b, x, y) {
  currentA = a;
  currentB = b;
  currentX = x;
  currentY = y;
  questionType = type;

  const getFunctionString = (a, b) => {
    if (b === 0) return `y = ${a}x`;
    if (b > 0) return `y = ${a}x + ${b}`;
    return `y = ${a}x - ${Math.abs(b)}`;
  };

  // --- 表問題 ---
  if (type === "table") {
    // 類似表問題
    let xVals = [];
    while (xVals.length < 3) {
      let xx = randInt(getRanges().xMin, getRanges().xMax);
      if (!xVals.includes(xx)) xVals.push(xx);
    }
    xVals.sort((a, b) => a - b);
    let blankIdx = randInt(0, 2);
    let yVals = xVals.map((xv, i) => i === blankIdx ? null : a * xv + b);
    let answerY = a * xVals[blankIdx] + b;
    let tableHtml = `<table><tr><th>x</th>`;
    xVals.forEach(xv => tableHtml += `<td>${xv}</td>`);
    tableHtml += `</tr><tr><th>y</th>`;
    yVals.forEach((yv, i) => {
      if (i === blankIdx) tableHtml += `<td><b>？</b></td>`;
      else tableHtml += `<td>${yv}</td>`;
    });
    tableHtml += "</tr></table>";

    document.getElementById("question").textContent = `次の表の「？」に入るyの値を答えてください。`;
    document.getElementById("tableArea").innerHTML = tableHtml;
    document.getElementById("tablePanel").style.display = "block";
    document.getElementById("tableProblem").textContent = "";
    document.getElementById("tableAnswerInput").value = "";
    document.getElementById("tableAnswerResult").textContent = "";
    document.getElementById("tableCheckBtn").style.display = "inline";
    document.getElementById("tableCheckBtn").onclick = () => {
      checkTableAnswer(answerY);
    }
    document.getElementById("graphPanel").style.display = "block";
    document.getElementById("graphProblem").textContent = `下のグラフを見て答えてください。`;
    drawAlgebraGraph(a, b);
    document.getElementById("slopeLabel").style.display = "none";
    document.getElementById("interceptLabel").style.display = "none";
    document.getElementById("graphCheckBtn").style.display = "none";
    document.getElementById("graphAnswerResult").textContent = "";
    document.getElementById("answerInput").style.display = "none";
    document.getElementById("answerInputA").style.display = "none";
    document.getElementById("answerInputB").style.display = "none";
    document.getElementById("checkBtn").style.display = "none";
    return;
  }

  // --- グラフ問題 ---
  if (type === "graph") {
    document.getElementById("question").textContent = "";
    document.getElementById("graphPanel").style.display = "block";
    document.getElementById("slopeLabel").style.display = "inline";
    document.getElementById("interceptLabel").style.display = "inline";
    document.getElementById("graphProblem").textContent =
      `下のグラフを見て答えてください。`;
    drawAlgebraGraph(a, b);
    document.getElementById("slopeInput").value = "";
    document.getElementById("interceptInput").value = "";
    document.getElementById("graphAnswerResult").textContent = "";
    document.getElementById("graphCheckBtn").style.display = "inline";
    document.getElementById("answerInput").style.display = "none";
    document.getElementById("answerInputA").style.display = "none";
    document.getElementById("answerInputB").style.display = "none";
    document.getElementById("checkBtn").style.display = "none";
    document.getElementById("tablePanel").style.display = "none";
    return;
  }

  // --- algebra系 ---
  if (type === "y") {
    document.getElementById("question").textContent = `一次関数のとき、x = ${x} の y の値は？`;
    document.getElementById("answerInput").placeholder = "yの値を入力";
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("answerInputA").style.display = "none";
    document.getElementById("answerInputB").style.display = "none";
    document.getElementById("checkBtn").style.display = "inline";
  } else if (type === "a") {
    document.getElementById("question").textContent = `x = ${x} のとき、y = ${y} となる一次関数の傾き a の値は？`;
    document.getElementById("answerInput").placeholder = "傾きを入力";
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("answerInputA").style.display = "none";
    document.getElementById("answerInputB").style.display = "none";
    document.getElementById("checkBtn").style.display = "inline";
  } else if (type === "b") {
    document.getElementById("question").textContent = `x = ${x} のとき、y = ${y} となる一次関数の切片 b の値は？`;
    document.getElementById("answerInput").placeholder = "切片を入力";
    document.getElementById("answerInput").style.display = "inline";
    document.getElementById("answerInputA").style.display = "none";
    document.getElementById("answerInputB").style.display = "none";
    document.getElementById("checkBtn").style.display = "inline";
  } else if (type === "ab") {
    // 例の式表示を削除しました
    document.getElementById("question").textContent = `一次関数の式「y = ax + b」のa（傾き）とb（切片）を答えてください。`;
    document.getElementById("answerInput").style.display = "none";
    document.getElementById("answerInputA").style.display = "inline";
    document.getElementById("answerInputB").style.display = "inline";
    document.getElementById("checkBtn").style.display = "inline";
  }
  document.getElementById("graphPanel").style.display = "block";
  document.getElementById("graphProblem").textContent = `下のグラフを見て答えてください。`;
  drawAlgebraGraph(a, b);
  document.getElementById("slopeLabel").style.display = "none";
  document.getElementById("interceptLabel").style.display = "none";
  document.getElementById("graphCheckBtn").style.display = "none";
  document.getElementById("answerResult").textContent = "";
  document.getElementById("tablePanel").style.display = "none";
}

function updateWrongProblemsPanel() {
  const panel = document.getElementById("similarProblemsPanel");
  const list = document.getElementById("similarProblemsList");
  if (wrongProblems.length === 0) {
    panel.style.display = "none";
    list.innerHTML = "";
    return;
  }
  panel.style.display = "block";
  let html = "";
  wrongProblems.forEach((p, i) => {
    if(p.type === "graph") {
      html += `<li>グラフ類似: 傾きa=${p.a}, 切片b=${p.b}</li>`;
    } else if(p.type === "table") {
      html += `<li>表類似: a=${p.a}, b=${p.b}, 答y=${p.y}</li>`;
    } else if(p.type === "y") {
      html += `<li>y類似: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    } else if(p.type === "a") {
      html += `<li>a類似: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    } else if(p.type === "b") {
      html += `<li>b類似: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    } else if(p.type === "ab") {
      html += `<li>ab類似: a=${p.a}, b=${p.b}</li>`;
    } else {
      html += `<li>その他: a=${p.a}, b=${p.b}, x=${p.x}, y=${p.y}</li>`;
    }
  });
  list.innerHTML = html;
}
