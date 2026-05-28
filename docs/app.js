const SIZE = 16;
const COPY_TEXT = "ドット絵を完成させました";
const patterns = [
  { name: "ハート", data: [
    "0000000000000000","0000110000110000","0001111001111000","0011111111111100",
    "0111111111111110","0111111111111110","0111111111111110","0011111111111100",
    "0001111111111000","0000111111110000","0000011111100000","0000001111000000",
    "0000000110000000","0000000000000000","0000000000000000","0000000000000000"
  ]},
  { name: "スマイル", data: [
    "0000000000000000","0000111111110000","0001100000011000","0010000000000100",
    "0100010000100010","0100010000100010","0100000000000010","0100000000000010",
    "0100100000010010","0100011111100010","0010000000000100","0001100000011000",
    "0000111111110000","0000000000000000","0000000000000000","0000000000000000"
  ]},
  { name: "T", data: [
    "0111111111111110","0000001100000000","0000001100000000","0000001100000000",
    "0000001100000000","0000001100000000","0000001100000000","0000001100000000",
    "0000001100000000","0000001100000000","0000001100000000","0000001100000000",
    "0000001100000000","0000000000000000","0000000000000000","0000000000000000"
  ]}
];

let patternIndex = 0;
let grid = createEmpty();
let history = [];
let isDragging = false;
let dragPaintValue = 1;

const targetGridEl = document.getElementById("targetGrid");
const editGridEl = document.getElementById("editGrid");
const patternNameEl = document.getElementById("patternName");
const pasteAreaEl = document.getElementById("pasteArea");
const pasteStatusEl = document.getElementById("pasteStatus");
const missionStatusEl = document.getElementById("missionStatus");
const copySourceEl = document.getElementById("copySource");

copySourceEl.value = COPY_TEXT;
document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("nextBtn").addEventListener("click", nextPattern);
pasteAreaEl.addEventListener("input", updateStatuses);
document.addEventListener("mouseup", () => { isDragging = false; });

renderTarget();
renderEditor();
updateStatuses();

function createEmpty() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }
function cloneGrid(src) { return src.map((r) => [...r]); }
function getTarget() { return patterns[patternIndex].data.map((row) => row.split("").map(Number)); }

function renderTarget() {
  targetGridEl.innerHTML = "";
  patternNameEl.textContent = patterns[patternIndex].name;
  const target = getTarget();
  target.forEach((row) => row.forEach((v) => targetGridEl.appendChild(cell(v, false, false))));
}

function renderEditor() {
  editGridEl.innerHTML = "";
  const target = getTarget();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const showHint = target[r][c] === 1 && grid[r][c] === 0;
      const d = cell(grid[r][c], true, showHint);
      d.dataset.r = String(r);
      d.dataset.c = String(c);
      d.addEventListener("mousedown", onDown);
      d.addEventListener("mouseenter", onEnter);
      editGridEl.appendChild(d);
    }
  }
}

function cell(value, editable, showHint) {
  const d = document.createElement("div");
  d.className = `cell${value ? " black" : ""}${showHint ? " hint" : ""}`;
  if (editable && showHint) d.textContent = "1";
  return d;
}

function onDown(e) {
  const r = Number(e.target.dataset.r);
  const c = Number(e.target.dataset.c);
  pushHistory();
  dragPaintValue = grid[r][c] ? 0 : 1;
  setCell(r, c, dragPaintValue);
  isDragging = true;
}

function onEnter(e) {
  if (!isDragging) return;
  const r = Number(e.target.dataset.r);
  const c = Number(e.target.dataset.c);
  setCell(r, c, dragPaintValue);
}

function setCell(r, c, value) {
  if (grid[r][c] === value) return;
  grid[r][c] = value;
  renderEditor();
  updateStatuses();
}

function pushHistory() {
  history.push(cloneGrid(grid));
  if (history.length > 100) history.shift();
}

function undo() {
  if (!history.length) return;
  grid = history.pop();
  renderEditor();
  updateStatuses();
}

function clearAll() {
  pushHistory();
  grid = createEmpty();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  renderEditor();
  updateStatuses();
}

function nextPattern() {
  patternIndex = (patternIndex + 1) % patterns.length;
  history = [];
  grid = createEmpty();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  renderTarget();
  renderEditor();
  updateStatuses();
}

function gridsMatch(a, b) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function normalize(text) {
  return text.replace(/\r/g, "").trim();
}

function updateStatuses() {
  const targetMatch = gridsMatch(grid, getTarget());
  const pasteMatch = normalize(pasteAreaEl.value) === COPY_TEXT;

  pasteStatusEl.textContent = pasteMatch
    ? "貼り付け成功：指定された文と一致しています。"
    : "貼り付け未完了：指定された文を Ctrl+V で貼り付けよう。";

  if (targetMatch && pasteMatch) {
    missionStatusEl.textContent = "ミッション完了！1の場所をぬってドット絵を完成させ、Ctrl+C / Ctrl+V もできました。";
  } else if (targetMatch && !pasteMatch) {
    missionStatusEl.textContent = "ドット絵は完成です。次は文を選んで Ctrl+C、下の箱に Ctrl+V で貼り付けよう。";
  } else if (!targetMatch && pasteMatch) {
    missionStatusEl.textContent = "コピー＆貼り付けは成功です。次は1の場所を黒くぬってドット絵を完成させよう。";
  } else {
    missionStatusEl.textContent = "1の場所を黒くぬり、文を Ctrl+C / Ctrl+V で貼り付けよう。";
  }
}
