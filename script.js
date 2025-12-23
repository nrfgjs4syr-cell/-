// 一onclick 属性次関数ゲーム - script.js（と
// グローバスタックオーバル関数名が自己ーフローと未定義バインディング参照してしまうことでの修正版）発生するスタックオーバーフロー
// （このファイルは index.htmlを解消しました。

// --- 状 の onclick/onchange から直接態変数 ---
let呼ばれるため、
 // 必要な currentA = 1, currentB =関数を window に明示 0, currentX = 0, current的に公開しています）

// --- 状態変数 ---
let currentY = 0;
let questionType = "yA = 1, current"; // y, a, b, ab, 2ptB = 0, currentX = , eq, rate
let graphA = 1, graphB = 00, currentY =, graphChart 0;
let questionType = "y"; // y = null, a, b, ab, ;
2pt, eq, rate
let currentGamelet graphA = QuestionType1, graphB = 0, graphChart = null;
let = "al currentGameQuestionType = "algebra";

let score = 0, life = 3, levelgebra = 1, timer =";

let score  = 30, timerInterval = null;
let gameActive0, life = = false;
let totalQuestions = 10, currentQuestion = 0 3,, correctCount = 0;
let wrongProblems = [] level;

// --- ユ = ーティリティ ---
function randInt(min, max) {1, return Math.floor(Math.random timer =() * (max - min + 1)) + 30 min; }
function clamp(val, timerInterval = null;
let game, min, max) { return Math.max(min, MathActive =.min(max, val)); }
function false clampDecimal(val);
 { return Math.round(val * 10) / 10; }
function approxEqual(alet, b, eps =  total1e-Questions6) = 10, { return Math.abs current(a -Question = b) 0 < eps; }
function parse, correctCount = Number(v0;
let) { const wrongProblems = n = [];

// Number --- ユーティリティ ---
function randInt(min, max) { return Math.floor(Math(v); return Number.isFinite(n).random() * (max - min + 1 ?)) + min; n : null; }
function clamp(val, min, }

// max) { return Math.max(min, Math.min(max --- wrongProblems 表,示 val));更新 ---
function }
function clamp updateWrongProblemsPanelDecimal(val)() { return Math {
  try.round(val * {
    const panel  = document10).get /ElementBy 10;Id(' }
similarProblemsPanel');
    const list = document.getElementByfunction approxEqualId(a('similar, bProblems,List');
 eps = 1e-6) {    if (! return Math.abspanel || !(a - b) <list) eps; }
function return;
    if (!Array.is parseNumber(vArray(wrongProblems)) || wrongProblems.length === 0) {
      panel.style.display { = 'none';
      list const.innerHTML = '';
      return;
 n    }
    = panel.style.display = 'block';
    list Number.innerHTML =(v '';
    wrongProblems.forEach((p, i) => {
     ); const li return = document.createElement('li');
      if (typeof Number p === 'string.is') li.textFiniteContent = p;
      else if(n (p) ? && n typeof p === 'object : null;') li }

// ---.text wrongProblems 表示更新 ---
Content =function updateWrongProblemsPanel() {
  p.question || try {
    const panel = document.getElementById(' JSONsimilarProblemsPanel');
    const list = document.getElementById('similarProblemsList');
    if (!panel || !list.stringify) return;
    if (!Array.is(p);
Array(wrongProblems)      || wrongProblems.length else li.textContent = String(p);
      const btn = === 0) {
      panel.style.display document.createElement('button');
      btn.text = 'Content = '練習';
      btnnone.style.marginLeft =';
 '8px';
      btn.className      = 'big-button';
      list.innerHTML = btn.onclick = () => { practiceWrongProblem(i); };
      '';
      li.appendChild(btn);
      list.appendChild(li);
    });
 return;
  } catch (err)    { console.error('update }
Wrong    panelProblemsPanel error.style.display:', err); }
 = 'block';
}

function    list.innerHTML = practiceWrongProblem '';
    wrong(indexProblems).forEach((p, i) {
  const p = => {
 wrongProblems      const li[index];
  = document if (!.createp) returnElement('li');
     ;
  const if (typeof p === qText = p '.question ||string') li String(p);
.textContent  = const q p;
El = document.getElement      else if (BypId('question');
  if (qEl &&) qEl.text typeof p ===Content 'object = `類') li.textContent似練 = p.question || JSON.stringify習:(p);
 ${q      elseText}`;
 li.text  hideContent =All String(p);
     Answer constUI btn = document.createElement('button();
  const ai = document');
      btn.textContent = '練.get習';
      btn.styleElement.marginLeft = 'ById('answer8Input'); if (pxai) ai.style.display = 'inline';
  const';
      cb = document btn.class.getElementByName =Id('check 'big-button';
Btn      btn.onclick'); if (cb = () =>) cb { practiceWrongProblem(i.style); };
      li.appendChild(btn);
      list.display =.appendChild(li 'inline);
';
     });
 focusAnswer  }Input catch (();
}

//err) { console.error('updateWrongProblemsPanel error:', err --- モバ); }
}

functionイル対応：input自動フォーカス ---
function focusAnswerInput practiceWrongProblem() {
(index)  setTimeout {
 (() => const p {
    = wrongProblems const ids[index];
 =  [" if (!p) return;
answer  const qInputText = p.question || String(p);
  const q", "answerInputEl = document.getA", "answerElementByIdInputB", "equ('ationInput", "squestion');
  if (qEllopeInput", "inter) qEl.textContent = `類ceptInput", "tableAnswerInput"];
    for (const id of ids) {
      const el = document.get似練習:Element ${qText}`;
  hideAllAnswerUI();
  const ai = documentById(id);
     .getElementById(' if (el && elanswerInput'); if.style.display !== "none") { (ai) ai.style try { el.focus.display = 'inline';
(); el.scrollIntoView({  const behavior: 'smooth', block: 'center' }); } cb = catch { } break; }
    }
  }, 300);
}

// --- モバイル対応：inputでエンター即判定 ---
function attachInputKeyEvents() {
  const check = () => { const cb document.getElement = document.getByElementId('checkBtn'); if (cb)By cb.style.display = 'inline';
  focusId("checkBtnAnswerInput();
}

//"); if (cb --- && cb.style.display !== "none") checkAnswer モ(); };
  constバイル対応：input graph自動フォーカス ---
Check =function focusAnswerInput() {
  setTimeout(() => {
    const ids = ["answerInput", "answerInputA", "answer () => { const gcb =InputB", "equationInput", document.getElement "sById("graphCheckBtn"); if (glopecbInput", && gcb.style.display !== "none "") checkGraphAnswer(); };
 inter ["answerInput", "ceptanswerInputA", "InputanswerInput",B", " "equationInput", "stablelopeAnswerInputInput","];
 "inter   cept forInput (",const "tableAnswerInput"].forEach(id => {
    const el id of = document.getElement idsById(id);
    if (el)) {
      el.onkeydown = (ev) => {
 {
        if (ev.key === "Enter") {
          ev.prevent     Default();
          if const (id === "tableAnswerInput") el check = document.getElementById(id);
      if (el && el.style.display !== "none();
          else if (id === "equationInput" || id === "slopeInput" || id === "interceptInput") graphCheck();
         ") else { check();
        }
 try { el.focus     (); el.scrollInto }
    }
 View });

 ({ behavior: const startBtn ' =smooth', block: ' document.getcenter' });ElementById('start } catch { }Btn');
 break; }
    }
  },  if ( start300);
}

// --- モバBtn && !startBtn._イル対応：inputでエンtouchター即判定 ---
function attachBound)Input {
   KeyEvents() {
  const check start = () => { const cb =Btn document.get.addEventElementListener('touchend',ById (("checkBtn"); if (ecb && cb.style.display !== "none") checkAnswer(); };
  const graphCheck = ()) => { const gcb = document =>.getElementById("graphCheckBtn"); if (gcb && gcb.style.display !== "none") checkGraphAnswer(); };
  ["answerInput", "answerInputA", "answerInputB", "equ {ationInput", "s elopeInput.prevent", "interceptDefaultInput", "tableAnswerInput"].forEach();(id => {
    const el = document.get startElementById(id);
    if (el)Btn {
      el.onkeydown = (ev) =>.click {
        if (ev.key === "Enter")(); {
          ev.preventDefault();
          if }, { passive: false });
    startBtn (id ===._touchBound = "tableAnswerInput true");
  }
 check();
         }
if (document else if (id.ready ===State === 'loading') window ".addEventequationInput" || id === "slopeInputListener"(' || id === "interDOMContentLoadedceptInput") graphCheck', attachInput();
KeyEvents         );
 elseelse attachInputKeyEvents();

// --- 難易度 check();
 /        }
      }
    }
 範囲 ---
function getLife  });

Limit  constByDifficulty(d startBtn) { return = document.getElement d === "ByIdeasy"('startBtn ? 5 : d');
  if === ( "normal"startBtn ? && 4 : ! 3startBtn; }
._touchBound) {
function get    startBtnTime.addEventListener('touchLimitByDifficulty(d)end', { return d === (e) => " { e.preventDefault(); starteasy" ? 45 : d === "normalBtn.click" ?(); }, 60 :  { passive: false40; });
    }
function setDifficulty startBtn._touchBound =Range(d true;
ifficulty) {
   if (difficulty === }
}
if (document.readyState === 'loading') "easy") window.addEvent {
    windowListener('DOMContentLoaded', attachInput.autoRangeKey = {Events);
else aMin: attachInput 1KeyEvents();

//, aMax: --- 難 3易, bMin: -3, bMax: 3度, x / 範Min囲 ---
function getLife:LimitByDifficulty(d) { return  d === "0easy" ? ,5 : xMax d: 5 === "normal" };
 ? 4 :  3; }
function } else if (difficulty getTime === "LimitByDifficultynormal")(d) { return {
    window d ===.autoRange = { "easy" aMin: -5, aMax: 5, bMin: -5, bMax: 5, x ? Min: -5,45 : d === "normal" ? 60 : 40; }
function setDifficulty xMax: 10Range(difficulty) {
  if (difficulty };
  } === " elseeasy") {
    window.autoRange {
    window = { aMin:.auto 1, aMax: 3,Range = { bMin aMin: -3: -10, aMax,: 10, bMin: - bMax10: 3,, bMax:  xMin: 10, xMin0,: -10 xMax,: xMax: 20 5 };
  } };
  }
 else if (difficulty  window.life === "normal")Limit = {
    window getLifeLimit.autoByDifficultyRange = { aMin(difficulty);
  window.timeLimit =: -5, aMax getTimeLimitByDifficulty: 5,(difficulty);
}
function bMin applyCustom:Range() {
  const el = document.getElement -5, bMax: 5,By xMin: -5, xMax:Id 10 };
  }("total else {
    window.autoRangeQuestions =Input {");
 a Min: const v = -10, aMax el: 10, ? Number bMin:(el.value) -10 : total, bMax: 10, xMin: -Questions;
10, xMax  if: 20 };
  }
  window.lifeLimit (v >= 1 = getLifeLimit) totalQuestions =ByDifficulty(d v;
ifficulty}
function);
 getRanges() { return window.autoRange || {  window.timeLimit aMin:  = get1, aMax:TimeLimitByDifficulty(difficulty );
}
function3, b applyMin: -3CustomRange() {
  const el = document,.getElement bMax: ById("3,totalQuestionsInput xMin: ");
 0 const, x v = elMax: ? 5 }; Number(el.value }
function) onProblemTypeChange() {
  const : totalQuestions;
  if ( v = document.getElementById("v >= 1problemType").value;
  if (["algebra)", "graph totalQuestions =", "table v;
}
", "rate",function getRanges() { return window.auto "mixRange || { aMin: 1"]., aMax: includes(v)) currentGame3, bQuestionType =Min: v;
}

// --- グ -3, bMaxラフ描画: 3（Chart.js 利用 / フォ,ールバック） xMin ---
function draw: 0AlgebraGraph, xMax(a, b: 5) {
  try }; }
function {
    const onProblemType canvasChange() = document {
  const v = document.getElement.getById("problemType").value;
  if (ElementById('["graphalgebra",Canvas');
    "graph", " if (!canvastable",) return "rate;
   ", "mix if (window.Chart) {
     "].includes if (graphChart) { try { graphChart(v)).destroy(); } currentGameQuestion catch{}Type = graphChart = null v;
}

// ---; }
 グ      const labelsラフ描 = [];
画（Chart.js      const data 利用 = [];
 / フ      constォール minX =バック） ---
function drawAlgebraGraph(a, b) {
  -5, maxX = try {
    5;
      const canvas = for ( documentlet.getElementById('graphCanvas');
    if x = min (!canvas) returnX;
    if (window.Chart;) {
      if (graphChart x) <= { max tryX { graph;Chart.destroy(); } catch x++) {{} graphChart = labels null; }
      const labels = [];
     .push const data = [];
      const(x minX = -5, maxX); = 5;
      for (let x data = minX; x <= maxX; x.push++) { labels.push(x); data.push(a(a * * x + b); }

      const y xVals = data.slice();
      const + minY = Math.min(...yVals), b maxY = Math.max(...yVals);
); }

      const y      const rangeY = Math.max(1e-6Vals, maxY - min = data.sliceY);
     ();
      let y const minYStep = Math = Math.max.min(0(...yVals.5, rangeY), max / 20Y = Math);
      if.max(...y (rangeValsY > );
20      const range) yStep =Y = Math.ceil Math.max((yStep1e);

      const ctx = canvas.getContext('2-d6,');
      maxY graph - minChart = newY);
 Chart(ctx      let yStep = Math.max(0.5, {
, rangeY        type / 20);
      if: (rangeY > 20) yStep = Math '.ceil(yStep);

     line const ctx =',
 canvas.getContext('        data2d');
      graph:Chart = new Chart {
(ctx, {
                 type: 'line',
        data labels: {
          labels,
          datasets: [{
           ,
 label: `y = ${a}         x + ${b}`,
            datasets data,
           : borderColor: '#3578 [{
           e5',
            background labelColor: 'rgba(53,120,:229,0.08)',
            fill: ` false,
            pointRadius: 0,
            pointyHoverRadius: 0,
            tension:  =0
          }]
        },
        options: {
          responsive: true ${,
a         } maintainx + ${b}`,
Aspect           Ratio data:,
            borderColor false: '#3578e,
5',
            backgroundColor:          'rgba(53 scales,120,229,0:.08)',
            fill: false,
            {
 pointRadius:            0,
            pointHoverRadius: 0 x,
            tension: 0
: { display          }]
        },
        options: {
          responsive: true,
:          maintainAspectRatio: false,
 true          scales: {
           , x: min { display: true,: min: minX, max: maxX, min ticks: { stepXSize: 1 }, },
            y: {
              max display: true,
:              suggestedMin: Math.floor((minY max - yStep) / yStep) * yStep,
              suggestedMax: Math.ceil((maxY +X, ticks: { stepSize: 1 } },
            y: {
              display: true,
              suggestedMin yStep) / yStep) * yStep,
              ticks: {
                stepSize: yStep: Math.floor((minY - yStep) / yStep) * yStep,
              suggestedMax:,
                callback: function(value) {
                  return Number.isInteger(value) ? String(value) : value.toFixed(1);
                }
              }
            }
 Math          },
         .ceil((max plugins: { legend:Y + yStep) / y { display: falseStep) * yStep,
 }, tooltip: { enabled: false } },
          elements: { point: { radius: 0, hoverRadius:               ticks: {
                stepSize: yStep,
                callback: function(value)0 } }
 { return Number.isInteger        }
      });
(value) ?      return;
    }

    // フ Stringォールバック描画
    const ctx = canvas.get(value) : value.toFixed(1); }
             Context }
           ('2d');
    const ratio }
          },
          plugins = window.device: { legend:PixelRatio { display || 1: false },;
    const w = canvas tooltip: { enabled: false }.clientWidth, h = },
          elements: canvas.clientHeight {;
    point: canvas.width = { radius Math.max(300, Math: 0, hover.floorRadius(w * ratio));
    canvas.height = Math.max(200: , Math0.floor } }
        }
      });
      return;
    }

    //(h * ratio));
    ctx.setTransform(r フォールバックatio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w描画
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
   , h);
    const w = canvas.clientWidth ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, ,0, w h, h);

 =    const minX canvas = -5,.client maxX = 5;
   Height const yVals =;
 []; for (let x    = minX canvas; x <= maxX; x++).width yVals.push(a * = x + b);
    const minY = Math.min(...yVals), maxY = Math.max(... Math.max(yVals300);
    const rangeY = Math.max(, Math.floor1e-6, maxY - minY);
    let yStep = Math.max((w *0.5, rangeY / 20);
    if (rangeY > 20 ratio) yStep = Math));
.ceil(yStep);

    const ys = rangeY || 1;
    const yToPx = (    canvas.height =yVal) => h Math.max - (((200, Math.floor(hy * ratio));
Val - minY) / ys) *    ctx.setTransform(ratio, 0 h;
    ctx.stroke, 0, ratioStyle =, 0,  '#eee';
    ctx.lineWidth =0);
    ctx.clear 1;
    ctxRect(0, 0,.fillStyle = '#666';
    ctx.font = '12 w, h);
px sans-serif';
    const startY =    ctx.fillStyle = '#f9f9f9';
    Math.floor(minY / yStep ctx.fillRect(0, 0, w,) * yStep;
    for (let yLine = h);

    const minX startY; = -5, maxX =  yLine <= maxY5;
    + 1 const yVals = [];e-9; yLine = Math.round for (let x = min((yLine + yXStep) * 1000000; x <= maxX) / 100000;0) x++) yVals.push(a * x + b {
);
    const      const py = yToPx(yLine);
      ctx minY.beginPath();
      = Math.min ctx.moveTo(0,(...yVals py);
      ctx.lineTo(w, py);
     ), ctx.stroke();
      const maxY = Math.max(...y label = NumberVals);
.is   Integer const rangeY(yLine) ? String(y = MathLine) : yLine.toFixed.max(1e(1);
      ctx.fillText(label, 6-6, maxY - minY);
   , py - 4);
    }

 let yStep = Math.max(    const y00.5,px rangeY / 20);
    if (range = yToPx(0);
Y > 20)    ctx.strokeStyle = '# yStep = Mathddd'; ctx.lineWidth.ceil =(yStep);

 1.5;
    ctx.beginPath(); ctx   .moveTo( const ys = rangeY || 1;
   0, y0px); const yToPx = ( ctx.lineTo(wyVal) => h - ((y, y0px); ctx.stroke();

   Val - minY) / ctx.strokeStyle ys) * h;
 = '#3578e5';    ctx.strokeStyle ctx.lineWidth = = 2; ctx '#eee';
    ctx.lineWidth = 1;
.beginPath();
       const steps = 200;
    for (let i = 0; ctx.fillStyle = '#666';
    ctx.font i = <= steps; i '12px sans++) {
     -serif';
    const t const startY = Math = i / steps;
.floor     (minY / const xVal yStep) * = minX yStep;
    + t * (maxX for (let yLine - minX = startY);
      const yVal =; yLine <= maxY +  a1e-9 * xVal + b;
      const px = t * w;
;      const py = yLine yTo = Math.round((yLine + yStep) * Px(yVal);
1000000      if (i) / 1000000) === 0) ctx.moveTo(px, py); else {
      const py = yToPx(yLine ctx.lineTo(px, py);
      ctx.begin);
    }
   Path(); ctx.moveTo( ctx.stroke();
  } catch (err) { console.error('0, py); ctx.lineTo(wdrawAlgebraGraph error:', err); }
}

//, py ---); ctx.stroke ヒント表示 ---
function();
      const show label = NumberHint() {
 .isInteger(y try {
   Line const hint) ? String(yLineEl) : y = document.getLine.toFixed(1);
      ctx.fillText(label, 6, py - 4);
    }

    const y0px = yElementToPx(0);
   By ctx.strokeStyle = '#ddd'; ctx.lineWidth =Id(' 1.hintText');
    if (!hintEl)5;
 return;
    ctx.beginPath();    let text = '';
    if (questionType === 'y') text = ctx.moveTo '(0, y0px); ctx.lineTo(w,ヒ y0px); ctx.stroke();

ント    ctx.strokeStyle = '#3578e5'; ctx.lineWidth = 2:; ctx 式 y = ax.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const xVal = minX + t * (max +X - min bX);
      const yVal = a * xVal + b;
      const px に x = t * w;
      const py を = yToPx(yVal);
     代 if (i === 0) ctx.moveTo(px,入して計算 py); else ctx.lineしますTo(px, py。);
    }
    ctx.stroke();
  } catch (err) { console.error('drawAlgebraGraph error';
:', err); }
   }

// --- ヒント表示 ---
function show elseHint() {
  try {
    const if (questionType hint ===El = document '.getaElement') text = 'ヒントById(': a = (y -hintText');
    if (!hintEl) return;
 b    let text =) '';
    / x if ( をquestion使Type === 'y') text =って 'ヒント傾: 式 y = ax + b に xきを を代入して計算します。';
   求め else if (questionType === 'a') textます = '。ヒント:';
 a = (y - b) /    x を使 else if (って傾きを求めます。';
    else ifquestionType (questionType === 'b === 'b') text') text = = 'ヒント: b = y 'ヒント: b = y - ax - ax を を使います。使います。';
    else if (questionType === '2pt'';
    || questionType === 'rate else if (') text = 'ヒントquestionType === '2pt': 傾き || questionType === 'rate') text =は Δ 'ヒント: 傾きは Δy / Δx y / Δx です。';
    elseです。';
 text = 'ヒント: y    else text = 'ヒント: y = ax + = ax + b の形を思い b出 の形しましょう。を思い';
    hint出しましょう。';
El.style.display = '    hintElblock';
    hintEl.textContent =.style.display = 'block';
    text;
 hintEl.text Content = text;
  } } catch ( catch (errerr) { console.error('showHint) { console error:', err); }
}

//.error('showHint error:', err --- ゲーム); }
}

//制御 ---
 --- ゲfunction startーム制Game()御 ---
function startGame() {
  score = 0 {
; level  score = = 1; 0; level =  currentQuestion = 01; currentQuestion; correctCount = 0 = 0; correctCount = 0;; gameActive = true;
  game wrongProblems = []; tryActive { updateWrongProblemsPanel =(); } true catch (e) {}
 ;
 const resultSummary =  document.getElementById("resultSummary"); wrong if (resultSummary) resultSummary.textProblems =Content = []; "";
  const answerResult = document.getElementBy tryId("answerResult"); if (answerResult {) answerResult.textContent = "";
  const updateWrong graphAnswerResult = documentProblemsPanel.getElementById("graph();AnswerResult"); if (graphAnswerResult } catch) graphAnswerResult.textContent = "";
 (  const tableAnswerResult = document.getElemente) {ById("tableAnswerResult"); if (table /* ignore */AnswerResult }

  const result) tableAnswerResult.textSummary =Content = "";
  document.getElement constById("resultSummary"); hint if (resultSummary) resultSummary.textContent = "";
  const answerEl = document.getResult = document.getElementElementById("hintText");ById("answerResult if (hint"); ifEl) (answer { hintResult) answerEl.style.display = "none"; hintEl.textContentResult = ""; }

.text  setDifficultyRange(document.getElementByIdContent("difficulty").value);
  life = window.life = "";
Limit; timer = window.time Limit;
  const scoreEl = const document.getElementById graph("score");Answer if (scoreEl) scoreResult =El.textContent = score;
 document.getElement  const lifeEl = document.getElementById("lifeById("graphAnswerResult"); if (lifeEl"); if (graph) lifeAnswerResult)El.textContent graphAnswerResult.textContent = = "";
  const tableAnswer life;
Result =  const document.getElementBy levelEl = documentId.getElement("tableAnswerById("level");Result"); if ( if (levelEltableAnswerResult) tableAnswer) levelEl.textContent = level;
  const timerEl = documentResult.textContent.getElementById("timer ="); if ( "";
  const hintEl =timerEl) timerEl.text document.getContent =ElementById (typeof timer !==("hintText '"); if (hintEl) { hintundefined' ? timer :El '');

  const startBtn.style.display = "none"; = document hintEl.getElementById.textContent =("startBtn"); ""; }

  setDifficulty if (startBtn) startRange(document.getElementBtn.style.displayById = "none";
  const("difficulty retryBtn"). = document.getElementByIdvalue);
  life = window("retryBtn"); if (.lifeLimit;
retryBtn) retry  timer =Btn.style.display = window.timeLimit;
  const scoreEl = "none";
 document.getElement  constById(" similarBtn = documentscore");.getElementById(" if (scoreEl) scoresimilarBtn");El.textContent if (similar = scoreBtn) similarBtn;
  const life.style.displayEl = document = wrongProblems.length > 0.get ? "inline-blockElementById" : "none";

  apply("life"); ifCustomRange (lifeEl();
  generate) lifeElGameQuestion();
  try.textContent = life;
  const levelEl = document.getElementById(" { startTimer(); }level"); if (level catchEl) (e) levelEl {}
}
function.textContent = level retryGame() { start;
 Game(); const timer }

function startTimerEl = document.getElementBy() {
  ifId (timerInterval) clearInterval("(timertimer"); ifInterval (timer);
 El) timerInterval timerEl.text = setIntervalContent = (typeof timer !==(() => {
    'undefined' ? timer : '');

 if (!game  const startBtn = document.getActive) { clearElementById("Interval(timerInterval); return;startBtn"); if (start }
    timer--; constBtn) startBtn.style.display = "none tEl = document.get";
 ElementBy constId("timer"); if retryBtn = document.getElement (tEl) tEl.textContent = timer;
    ifById("retryBtn"); (timer <= if ( 0)retryBtn) loseLife retryBtn();
 .style.display }, = "none";
 1000  const similarBtn = document.getElement);
}
function loseById("Life()similarBtn {
"); if (similarBtn  life--; const life) similarBtnEl = document.get.style.display = wrongElementById("Problems.length >life"); if 0 (lifeEl) lifeEl.textContent ? "inline = life;
  timer = window.time-block"Limit; : "none const tEl";

  = document applyCustomRange.getElementBy();
 Id("timer"); if ( generateGameQuestion();

  try { starttElTimer) tEl.textContent =(); timer;
 }  if (life catch (e) <=  { /* ignore */ }
0) endGame();
}

function retryGame  else setTimeout(()() { start => { generateGame(); }

GameQuestionfunction(); focusAnswerInput(); start }, 800);
}
function endGameTimer() {
  gameActive =() {
  if false; clear (timerInterval(timerInterval);
  const goInterval)Panel clearInterval(timerInterval);
  = document.get timerInterval = setElementInterval(() => {
ById("gameOver    ifPanel"); if ( (!gameActive) { cleargoPanel) goInterval(timerIntervalPanel.style.display = "block); return; }
    timer--;";
 const tEl = document.getElement  constById(" retrytimer"); if (tBtn = document.getEl) tElElementById(".textretryContent = timer;
Btn");    if (timer if <= (retry Btn0) loseLife();
) retryBtn  }, 1000);
}
.style.display = "inlinefunction-block";
  const checkBtn = document.getElementById loseLife() {
  life("checkBtn--; const life"); ifEl = document.getElementById (checkBtn) checkBtn.style("life.display = "");none";
  const graphCheck if (Btn = document.getlifeElElementById("graphCheck) lifeEl.textContentBtn"); if = life;
  timer = window (graphCheckBtn.timeLimit; const) graphCheckBtn.style.display = "none";
  const t graphPanel = document.getElementById("graphEl =Panel"); if (graphPanel document) graphPanel.style.get.display = "noneElement";
  constBy tablePanel = document.getElementById("tablePanel"); ifId(" (tablePanel) tablePaneltimer.style.display"); = "none";
  if const ( qtn = document.getElementByIdEl("questionNumber"); if (qn)) qn.textContent = "";
  const t resultSummary = document.getElementByElId("resultSummary");
.text  if (ContentresultSummary) resultSummary.textContent = `終了！ =正解数: ${correctCount timer} / ${totalQuestions}（正;
 答率 if (life: ${totalQuestions ? <= 0) Math.round((correct endCount / totalQuestions) *Game();
  100) : 0}%） else setTimeout(() => {`;
}

// generateGame --- 出題ロQuestion(); focusAnswerInput(); },ジック（省略 800);
せず実}
function装済み） ---
// （generateGameQuestion endGame() {
 , generateAlgebraQuestionImproved, generate gameActive = false;
 RateQuestion,
// clearInterval(timerInterval  generateTableQuestion, check);
  constTableAnswer, generateGraphQuestion goPanel = document, checkAnswer,
//.get  checkGraphElementByAnswer は上のId("gameOverPanelパターンに従"); if (goPanel) goPanel.styleって本ファイル内.display = "に実装されblockていることを";
  const retryBtn想定します） =
// （ここでは document.getElementById("retryBtn");長さの都合で省略 if (しないでretryください。実際のリBtn)ポジト retryBtn.style.display =リ "inline-block";
  const checkBtn =への document.getElementById("反checkBtn映"); if (check時Btn) checkBtn.styleは.display = "none";
完全  const graphCheckBtn版 = document.getElementByIdを("graphCheckBtn"); if使 (graphってCheckBtnください) graphCheckBtn.style.display = "。）

none";
  const graphPanel// = document.getElementById("graphPanel"); if (graph ---Panel 類) graphPanel.style.display = "none";
  const tablePanel = document.get似Element問題ボタン ---
functionById challengeSimilar("tablePanel");Problem() {
  if if (tablePanel (!wrong) tablePanel.style.display = "none";
  const qProblems || wrongn =Problems.length document.get === 0ElementBy) {Id("question alert('類Number");似練習候 if (qn補がありません) qn。');.textContent = "";
 return; }
  const resultSummary  practiceWrongProblem = document(0.getElementBy);
}

// --- グId("ロresultSummaryーバ");
 ルに公開（index.html if (result の inline handlers に必要Summary）) resultSummary.textContent ---
//  = `終了重要: ここで！ window に直接割り当て正ることで解数: index.html の onclick/on ${correctchange がCount} / ${参照できるようにするtotalQuestions}
window（正答率.startGame =: ${ startGame;
window.retryGametotalQuestions ? Math.round((correctCount = retryGame;
window / totalQuestions).showHint = showHint;
window.checkAnswer = check * 100Answer) : 0}%）;
window`;
}

// --- 出題ロジック.checkGraphAnswer = checkGraph ---
functionAnswer;
window.check generateGameQuestionTableAnswer =() {
 checkTable  if (!Answer;gameActive) return;
 // ここがポイント  if (：直接本currentQuestion >= total体を公開（Questions)ラッパ {ーを使うと endGame(); return;再帰 }
 になる危険 currentQuestion++;
 あり）
window const q.applyCustomRangenEl = = applyCustomRange;
window.set document.getElementDifficultyByRange = setDifficultyRange;
Id("questionNumber");window.onProblem ifType (qnChange =El on)Problem qTypenChangeEl.text;
windowContent.challengeSimilar = `Problem = challengeSimilarProblem;
