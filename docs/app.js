const COPY_TEXT = "ドット絵を完成させました";
const DOWNLOAD_MESSAGE = "BMPを保存しました。ダウンロードフォルダを確認してください。";
const DOWNLOAD_LOCK_MS = 1800;
const COLOR_COUNT = {
  [MODE_PRACTICE]: 2,
  [MODE_ADVANCED]: 4
};
const MODE_INSTRUCTIONS = {
  [MODE_PRACTICE]: [
    "練習モードでは、16×16マスで『1』がある場所を黒くぬります。",
    "同じマスをもう一度クリックすると、白に戻せます。",
    "ドラッグすると、続けてぬれます。"
  ],
  [MODE_ADVANCED]: [
    "上級モードでは、32×32マスで『白色・銀色・灰色・黒色』を見本に合わせます。",
    "パレットで色を選んでから、マスをクリックまたはドラッグしてぬります。",
    "色を変えるときは、先にパレットで色を選びます。"
  ]
};

let patternIndex = 0;
let colorMode = MODE_PRACTICE;
let grid = createEmptyGrid();
let targetGrid = createTargetGrid();
let editorCellElements = [];
let isDragging = false;
let dragPaintValue = 1;
let selectedColor = 3;

const targetGridEl = document.getElementById("targetGrid");
const editGridEl = document.getElementById("editGrid");
const patternNameEl = document.getElementById("patternName");
const instructionListEl = document.getElementById("instructionList");
const pasteAreaEl = document.getElementById("pasteArea");
const pasteStatusEl = document.getElementById("pasteStatus");
const missionStatusEl = document.getElementById("missionStatus");
const downloadStatusEl = document.getElementById("downloadStatus");
const copySourceEl = document.getElementById("copySource");
const modeBtnEl = document.getElementById("modeBtn");
const downloadBtnEl = document.getElementById("downloadBtn");
const paletteEl = document.getElementById("palette");
const swatchEls = Array.from(document.querySelectorAll(".swatch"));

copySourceEl.value = COPY_TEXT;
modeBtnEl.addEventListener("click", toggleMode);
downloadBtnEl.addEventListener("click", downloadBitmap);
swatchEls.forEach((swatch) => swatch.addEventListener("click", selectColor));
document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("nextBtn").addEventListener("click", nextPattern);
pasteAreaEl.addEventListener("input", updateStatuses);
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);

renderAll();

function getGridSize() {
  return colorMode === MODE_ADVANCED ? ADVANCED_SIZE : PRACTICE_SIZE;
}

function getHexLabels() {
  return Array.from({ length: getGridSize() }, (_, i) => formatAxisLabel(i));
}

function formatAxisLabel(index) {
  const digits = colorMode === MODE_ADVANCED ? 2 : 1;
  return index.toString(16).toUpperCase().padStart(digits, "0");
}

function createEmptyGrid() {
  const size = getGridSize();
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function createTargetGrid() {
  const pattern = PATTERNS[patternIndex][colorMode];
  return pattern.map((row) => row.split("").map(Number));
}

function renderAll() {
  renderInstructions();
  renderTargetGrid();
  renderEditorGrid();
  renderPalette();
  updateStatuses();
}

function renderInstructions() {
  instructionListEl.innerHTML = "";
  MODE_INSTRUCTIONS[colorMode].forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    instructionListEl.appendChild(item);
  });
}

function renderTargetGrid() {
  targetGridEl.innerHTML = "";
  targetGridEl.className = `grid ${getGridClass()}`;
  patternNameEl.textContent = `${PATTERNS[patternIndex].name}・${getModeLabel()}`;

  targetGrid = createTargetGrid();
  const labels = getHexLabels();
  renderCoordinateLabels(targetGridEl, labels);
  targetGrid.forEach((row, r) => {
    targetGridEl.appendChild(axisLabel(labels[r]));
    row.forEach((value, c) => targetGridEl.appendChild(createCell(value, false, false, r, c, labels)));
  });
}

function renderEditorGrid() {
  editGridEl.innerHTML = "";
  editGridEl.className = `grid ${getGridClass()}`;
  editorCellElements = [];

  const labels = getHexLabels();
  renderCoordinateLabels(editGridEl, labels);

  for (let r = 0; r < getGridSize(); r++) {
    editGridEl.appendChild(axisLabel(labels[r]));
    editorCellElements[r] = [];
    for (let c = 0; c < getGridSize(); c++) {
      const cellEl = createCell(grid[r][c], true, shouldShowHint(r, c), r, c, labels);
      cellEl.dataset.r = String(r);
      cellEl.dataset.c = String(c);
      cellEl.addEventListener("pointerdown", onPointerDown);
      cellEl.addEventListener("pointerenter", onPointerEnter);
      editorCellElements[r][c] = cellEl;
      editGridEl.appendChild(cellEl);
    }
  }
}

function renderCoordinateLabels(gridEl, labels) {
  gridEl.appendChild(axisLabel(""));
  labels.forEach((label) => gridEl.appendChild(axisLabel(label)));
}

function axisLabel(label) {
  const d = document.createElement("div");
  d.className = "axis-label";
  d.textContent = label;
  return d;
}

function createCell(value, editable, showHint, r, c, labels) {
  const d = document.createElement("div");
  d.className = getCellClassName(value, showHint);
  d.setAttribute("aria-label", `${labels[c]},${labels[r]}`);
  d.textContent = editable && showHint ? "1" : "";
  return d;
}

function updateEditorCell(r, c) {
  const cellEl = editorCellElements[r]?.[c];
  if (!cellEl) return;
  const showHint = shouldShowHint(r, c);
  cellEl.className = getCellClassName(grid[r][c], showHint);
  cellEl.setAttribute("aria-label", `${formatAxisLabel(c)},${formatAxisLabel(r)}`);
  cellEl.textContent = showHint ? "1" : "";
}

function getCellClassName(value, showHint) {
  const shade = colorMode === MODE_PRACTICE && value === 1 ? 3 : value;
  return `cell shade-${shade}${showHint ? " hint" : ""}`;
}

function shouldShowHint(r, c) {
  if (colorMode !== MODE_PRACTICE || grid[r][c] !== 0) return false;
  return targetGrid[r][c] === 1;
}

function getGridClass() {
  return colorMode === MODE_ADVANCED ? "advanced-grid" : "practice-grid";
}

function getModeLabel() {
  return colorMode === MODE_ADVANCED ? "上級モード" : "練習モード";
}

function onPointerDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  const r = Number(e.currentTarget.dataset.r);
  const c = Number(e.currentTarget.dataset.c);
  dragPaintValue = colorMode === MODE_ADVANCED ? selectedColor : (grid[r][c] + 1) % COLOR_COUNT[colorMode];
  setCell(r, c, dragPaintValue);
  isDragging = true;
}

function onPointerEnter(e) {
  if (!isDragging || e.buttons !== 1) return;
  e.preventDefault();
  const r = Number(e.currentTarget.dataset.r);
  const c = Number(e.currentTarget.dataset.c);
  setCell(r, c, dragPaintValue);
}

function endDrag() {
  isDragging = false;
}

function setCell(r, c, value) {
  if (grid[r][c] === value) return;
  grid[r][c] = value;
  updateEditorCell(r, c);
  updateStatuses();
}

function clearAll() {
  grid = createEmptyGrid();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  downloadStatusEl.textContent = "";
  renderEditorGrid();
  updateStatuses();
}

function selectColor(e) {
  selectedColor = Number(e.currentTarget.dataset.color);
  renderPalette();
}

function renderPalette() {
  paletteEl.hidden = colorMode !== MODE_ADVANCED;
  swatchEls.forEach((swatch) => {
    const isSelected = Number(swatch.dataset.color) === selectedColor;
    swatch.classList.toggle("selected", isSelected);
    swatch.setAttribute("aria-pressed", String(isSelected));
  });
}

function toggleMode() {
  colorMode = colorMode === MODE_PRACTICE ? MODE_ADVANCED : MODE_PRACTICE;
  selectedColor = 3;
  resetForNewGrid();
  modeBtnEl.textContent = colorMode === MODE_ADVANCED ? "練習モードにする" : "上級モードにする";
  renderAll();
}

function nextPattern() {
  patternIndex = (patternIndex + 1) % PATTERNS.length;
  resetForNewGrid();
  renderTargetGrid();
  renderEditorGrid();
  updateStatuses();
}

function resetForNewGrid() {
  grid = createEmptyGrid();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  downloadStatusEl.textContent = "";
}

function downloadBitmap() {
  downloadBtnEl.disabled = true;
  let objectUrl = "";

  try {
    const isAdvanced = colorMode === MODE_ADVANCED;
    const bitCount = isAdvanced ? 4 : 1;
    const blob = new Blob([createBitmapBytes(grid, { width: getGridSize(), bitCount })], { type: "image/bmp" });
    const link = document.createElement("a");
    const modeName = isAdvanced ? "上級" : "練習";

    objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = `ドット絵_${PATTERNS[patternIndex].name}_${modeName}.bmp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    downloadStatusEl.textContent = DOWNLOAD_MESSAGE;
  } finally {
    setTimeout(() => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      downloadBtnEl.disabled = false;
    }, DOWNLOAD_LOCK_MS);
  }
}

function gridsMatch(a, b) {
  for (let r = 0; r < getGridSize(); r++) {
    for (let c = 0; c < getGridSize(); c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function normalize(text) {
  return text.replace(/\r/g, "").trim();
}

function updateStatuses() {
  const targetMatch = gridsMatch(grid, targetGrid);
  const pasteMatch = normalize(pasteAreaEl.value) === COPY_TEXT;

  pasteStatusEl.textContent = pasteMatch
    ? "貼り付け成功：指定された文と一致しています。"
    : "貼り付け未完了：指定された文を Ctrl+V で貼り付けよう。";

  if (targetMatch && pasteMatch) {
    missionStatusEl.textContent = "ミッション完了！ドット絵を完成させ、Ctrl+C / Ctrl+V もできました。";
  } else if (targetMatch) {
    missionStatusEl.textContent = "ドット絵は完成です。次は文を選んで Ctrl+C、下の箱に Ctrl+V で貼り付けよう。";
  } else if (pasteMatch) {
    missionStatusEl.textContent = "コピー＆貼り付けは成功です。次は見本に合わせてドット絵を完成させよう。";
  } else {
    missionStatusEl.textContent = colorMode === MODE_ADVANCED
      ? "パレットで色を選び、見本と同じ上級モードの色にぬり、文を Ctrl+C / Ctrl+V で貼り付けよう。"
      : "1の場所を黒くぬり、文を Ctrl+C / Ctrl+V で貼り付けよう。";
  }
}
