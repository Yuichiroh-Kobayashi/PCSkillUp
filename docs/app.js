const SIZE = 16;
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
const binaryDataEl = document.getElementById("binaryData");
const pasteAreaEl = document.getElementById("pasteArea");
const pasteStatusEl = document.getElementById("pasteStatus");
const missionStatusEl = document.getElementById("missionStatus");
const copyMessageEl = document.getElementById("copyMessage");

document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("nextBtn").addEventListener("click", nextPattern);
document.getElementById("copyBtn").addEventListener("click", copyData);
pasteAreaEl.addEventListener("input", updateStatuses);
document.addEventListener("mouseup", () => { isDragging = false; });

renderTarget();
renderEditor();
updateBinaryText();
updateStatuses();

function createEmpty() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }
function cloneGrid(src) { return src.map((r) => [...r]); }
function getTarget() { return patterns[patternIndex].data.map((row) => row.split("").map(Number)); }

function renderTarget() {
  targetGridEl.innerHTML = "";
  patternNameEl.textContent = patterns[patternIndex].name;
  const target = getTarget();
  target.forEach((row) => row.forEach((v) => targetGridEl.appendChild(cell(v))));
}
function renderEditor() {
  editGridEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const d = cell(grid[r][c]);
      d.dataset.r = String(r);
      d.dataset.c = String(c);
      d.addEventListener("mousedown", onDown);
      d.addEventListener("mouseenter", onEnter);
      editGridEl.appendChild(d);
    }
  }
}
function cell(v) {
  const d = document.createElement("div");
  d.className = `cell${v ? " black" : ""}`;
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
  updateBinaryText();
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
  updateBinaryText();
  updateStatuses();
}
function clearAll() {
  pushHistory();
  grid = createEmpty();
  pasteAreaEl.value = "";
  copyMessageEl.textContent = "";
  renderEditor();
  updateBinaryText();
  updateStatuses();
}
function nextPattern() {
  patternIndex = (patternIndex + 1) % patterns.length;
  history = [];
  grid = createEmpty();
  pasteAreaEl.value = "";
  copyMessageEl.textContent = "";
  renderTarget();
  renderEditor();
  updateBinaryText();
  updateStatuses();
}
function toBinaryString(src) {
  return src.map((row) => row.join("")).join("\n");
}
function normalize(text) {
  return text.replace(/\r/g, "").trim();
}
function updateBinaryText() {
  binaryDataEl.value = toBinaryString(grid);
}
async function copyData() {
  const text = binaryDataEl.value;
  copyMessageEl.textContent = "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      copyMessageEl.textContent = "コピーしました。下の箱に Ctrl+V で貼り付けよう。";
      return;
    } catch (_) {}
  }
  binaryDataEl.focus();
  binaryDataEl.select();
  copyMessageEl.textContent = "Ctrl+C を押してコピーしてください。";
}
function updateStatuses() {
  const gridText = normalize(binaryDataEl.value);
  const pasted = normalize(pasteAreaEl.value);
  const targetMatch = toBinaryString(grid) === toBinaryString(getTarget());
  const pasteMatch = pasted !== "" && pasted === gridText;

  pasteStatusEl.textContent = pasteMatch
    ? "貼り付けデータOK：作業グリッドと一致しています。"
    : "貼り付けデータ未一致：コピーして Ctrl+V で貼り付けを確認しよう。";

  if (targetMatch && pasteMatch) {
    missionStatusEl.textContent = "ミッション完了！見本どおりに作成でき、0/1データの貼り付けも成功しました。";
  } else if (!targetMatch && pasteMatch) {
    missionStatusEl.textContent = "貼り付けは成功です。次は見本どおりのドット絵を完成させよう。";
  } else if (targetMatch && !pasteMatch) {
    missionStatusEl.textContent = "見本は完成です。次は0/1データをコピーして Ctrl+V で貼り付けよう。";
  } else {
    missionStatusEl.textContent = "見本を見ながらドット絵を作り、完成したらコピー＆貼り付けをしよう。";
  }
}
