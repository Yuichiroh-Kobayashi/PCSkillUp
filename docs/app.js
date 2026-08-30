const COPY_TEXT = "ドット絵を完成させました";
const DOWNLOAD_MESSAGE = "BMPを保存しました。ダウンロードフォルダを確認してください。";
const DOWNLOAD_LOCK_MS = 1800;
const STAGE_PATTERN_COUNT = 3;
const COLOR_COUNT = {
  [MODE_PRACTICE]: 2,
  [MODE_ADVANCED]: 4
};
const THEME_LABELS = {
  light: "暗いモードにする",
  dark: "明るいモードにする"
};
const STAGES = {
  [MODE_PRACTICE]: {
    badge: "STAGE 1",
    name: "ステージ1：ビットゲート",
    description: "1の場所を黒くぬり、指定された文をコピー＆ペーストしよう！",
    instructions: [
      "16×16マスで『1』がある場所を黒くぬります。",
      "同じマスをもう一度クリックすると、白に戻せます。",
      "ドラッグすると、続けてぬれます。"
    ]
  },
  [MODE_ADVANCED]: {
    badge: "STAGE 2",
    name: "ステージ2：ピクセルキャプチャー",
    description: "4色ドット絵を作り、スクリーンショットを提出しよう！",
    instructions: [
      "32×32マスで『白色・銀色・灰色・黒色』を使ってドット絵を作ります。",
      "パレットで色を選んでから、マスをクリックまたはドラッグしてぬります。",
      "完成したらスクリーンショットを提出する練習をしよう。"
    ]
  }
};

let patternIndex = getRandomStagePatternIndex();
let colorMode = MODE_PRACTICE;
let grid = createEmptyGrid();
let targetGrid = createTargetGrid();
let editorCellElements = [];
let isDragging = false;
let dragPaintValue = 1;
let selectedColor = 3;
let isStageOneCleared = false;
const darkSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let manualTheme = null;

const targetGridEl = document.getElementById("targetGrid");
const mainEl = document.querySelector("main");
const stagePanelEl = document.getElementById("modeInstructions");
const gridsEl = document.querySelector(".grids");
const stageBadgeEl = document.getElementById("stageBadge");
const themeToggleEl = document.getElementById("themeToggle");
const themeToggleLabelEl = document.getElementById("themeToggleLabel");
const editGridEl = document.getElementById("editGrid");
const patternNameEl = document.getElementById("patternName");
const stageNameEl = document.getElementById("stageName");
const stageDescriptionEl = document.getElementById("stageDescription");
const instructionListEl = document.getElementById("instructionList");
const pasteAreaEl = document.getElementById("pasteArea");
const pasteStatusEl = document.getElementById("pasteStatus");
const missionStatusEl = document.getElementById("missionStatus");
const downloadStatusEl = document.getElementById("downloadStatus");
const copySourceEl = document.getElementById("copySource");
const modeBtnEl = document.getElementById("modeBtn");
const downloadBtnEl = document.getElementById("downloadBtn");
const exerciseTitleEl = document.getElementById("exerciseTitle");
const exerciseDescriptionEl = document.getElementById("exerciseDescription");
const copyPracticeControlsEl = document.getElementById("copyPracticeControls");
const screenshotNoticeEl = document.getElementById("screenshotNotice");
const paletteEl = document.getElementById("palette");
const swatchEls = Array.from(document.querySelectorAll(".swatch"));
const clearEffectEl = document.getElementById("clearEffect");
const clearActionsEl = document.getElementById("clearActions");
const retryBtnEl = document.getElementById("retryBtn");
const stage2BtnEl = document.getElementById("stage2Btn");

copySourceEl.value = COPY_TEXT;
themeToggleEl.addEventListener("click", toggleTheme);
modeBtnEl.addEventListener("click", toggleMode);
retryBtnEl.addEventListener("click", retryStageOne);
stage2BtnEl.addEventListener("click", goToStageTwo);
downloadBtnEl.addEventListener("click", downloadBitmap);
swatchEls.forEach((swatch) => swatch.addEventListener("click", selectColor));
document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("nextBtn").addEventListener("click", nextPattern);
pasteAreaEl.addEventListener("input", updateStatuses);
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);

renderThemeToggle();
watchSystemColorScheme();
updateStageControls();
renderAll();

function getActiveTheme() {
  if (manualTheme) return manualTheme;
  return darkSchemeQuery.matches ? "dark" : "light";
}

function renderThemeToggle() {
  const label = THEME_LABELS[getActiveTheme()];
  themeToggleLabelEl.textContent = label;
  themeToggleEl.setAttribute("aria-label", label);
}

function toggleTheme() {
  manualTheme = getActiveTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", manualTheme);
  renderThemeToggle();
}

function watchSystemColorScheme() {
  const onSchemeChange = () => {
    if (manualTheme) return;
    renderThemeToggle();
  };
  if (typeof darkSchemeQuery.addEventListener === "function") {
    darkSchemeQuery.addEventListener("change", onSchemeChange);
  } else if (typeof darkSchemeQuery.addListener === "function") {
    darkSchemeQuery.addListener(onSchemeChange);
  }
}

function playStageTransition() {
  [stagePanelEl, gridsEl].forEach((el) => {
    if (!el) return;
    el.classList.remove("stage-swap");
    void el.offsetWidth;
    el.classList.add("stage-swap");
  });
}

function markVisibleKeyHints() {
  [copyPracticeControlsEl, screenshotNoticeEl].forEach((container) => {
    if (!container || container.hidden) return;
    container.querySelectorAll(".shortcut-guide").forEach((guide) => {
      if (guide.dataset.introduced === "true") return;
      guide.dataset.introduced = "true";
      guide.classList.add("key-intro");
    });
  });
}

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
  renderExercise();
  updateStatuses();
}

function renderInstructions() {
  stageBadgeEl.textContent = STAGES[colorMode].badge;
  stageNameEl.textContent = STAGES[colorMode].name;
  stageDescriptionEl.textContent = STAGES[colorMode].description;
  instructionListEl.innerHTML = "";
  STAGES[colorMode].instructions.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    instructionListEl.appendChild(item);
  });
}

function renderTargetGrid() {
  targetGridEl.innerHTML = "";
  targetGridEl.className = `grid ${getGridClass()}`;
  patternNameEl.textContent = PATTERNS[patternIndex].name;

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
  resetForNewGrid();
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

function renderExercise() {
  const isAdvanced = colorMode === MODE_ADVANCED;
  exerciseTitleEl.textContent = isAdvanced ? "スクリーンショット練習" : "コピー＆ペースト練習";
  exerciseDescriptionEl.textContent = isAdvanced
    ? "作品を作ったら、Win + Shift + S でスクリーンショットを撮り、先生が指示するアプリに Ctrl + V でペーストしよう。"
    : "";
  copyPracticeControlsEl.hidden = isAdvanced;
  screenshotNoticeEl.hidden = !isAdvanced;
  pasteStatusEl.hidden = isAdvanced;
  markVisibleKeyHints();
}

function toggleMode() {
  if (colorMode === MODE_PRACTICE) return;
  colorMode = MODE_PRACTICE;
  patternIndex = getRandomStagePatternIndex();
  selectedColor = 3;
  resetForNewGrid();
  updateStageControls();
  renderAll();
  playStageTransition();
}

function goToStageTwo() {
  colorMode = MODE_ADVANCED;
  patternIndex = getRandomStagePatternIndex();
  selectedColor = 3;
  resetForNewGrid();
  updateStageControls();
  renderAll();
  playStageTransition();
}

function retryStageOne() {
  const previousPatternIndex = patternIndex;
  colorMode = MODE_PRACTICE;
  patternIndex = getDifferentStagePatternIndex(previousPatternIndex);
  selectedColor = 3;
  resetForNewGrid();
  updateStageControls();
  renderAll();
  playStageTransition();
}

function nextPattern() {
  patternIndex = (patternIndex + 1) % STAGE_PATTERN_COUNT;
  resetForNewGrid();
  renderTargetGrid();
  renderEditorGrid();
  updateStatuses();
}

function getRandomStagePatternIndex() {
  return Math.floor(Math.random() * STAGE_PATTERN_COUNT);
}

function getDifferentStagePatternIndex(previousPatternIndex) {
  const candidates = Array.from({ length: STAGE_PATTERN_COUNT }, (_, index) => index)
    .filter((index) => index !== previousPatternIndex);
  if (candidates.length === 0) return previousPatternIndex;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function updateStageControls() {
  modeBtnEl.hidden = colorMode !== MODE_ADVANCED;
  modeBtnEl.textContent = "ステージ1に戻る";
  downloadBtnEl.hidden = true;
  updateClearActions();
}

function updateClearActions() {
  clearActionsEl.hidden = colorMode !== MODE_PRACTICE || !isStageOneCleared;
}

function showStageOneClearEffect() {
  clearEffectEl.hidden = false;
  if (mainEl) mainEl.inert = true;
  clearEffectEl.classList.remove("play");
  void clearEffectEl.offsetWidth;
  clearEffectEl.classList.add("play");
}

function resetStageOneClearEffect() {
  clearEffectEl.hidden = true;
  if (mainEl) mainEl.inert = false;
  clearEffectEl.classList.remove("play");
}

function resetForNewGrid() {
  grid = createEmptyGrid();
  pasteAreaEl.value = "";
  setStatus(pasteStatusEl, "");
  setStatus(missionStatusEl, "");
  downloadStatusEl.textContent = "";
  isStageOneCleared = false;
  resetStageOneClearEffect();
  updateClearActions();
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

function setStatus(el, text, tone = "") {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("is-success", "is-warning", "is-next");
  if (tone) el.classList.add(tone);
}

function updateStatuses() {
  const targetMatch = colorMode === MODE_PRACTICE && gridsMatch(grid, targetGrid);
  const pasteMatch = normalize(pasteAreaEl.value) === COPY_TEXT;

  setStatus(
    pasteStatusEl,
    pasteMatch
      ? "ペースト成功：指定された文と一致しています。"
      : "ペースト未完了：文を選んで Ctrl + C でコピーし、Ctrl + V でペーストしよう。",
    pasteMatch ? "is-success" : "is-warning"
  );

  if ((!targetMatch || !pasteMatch) && isStageOneCleared) {
    isStageOneCleared = false;
    resetStageOneClearEffect();
    updateClearActions();
  }

  if (targetMatch && pasteMatch) {
    setStatus(missionStatusEl, "ミッション完了！ドット絵を完成させ、コピー＆ペーストもできました。", "is-success");
    if (!isStageOneCleared) {
      isStageOneCleared = true;
      showStageOneClearEffect();
      updateClearActions();
    }
  } else if (targetMatch) {
    setStatus(
      missionStatusEl,
      "ドット絵は完成です。次は文を選んで Ctrl + C でコピーし、下の箱に Ctrl + V でペーストしよう。",
      "is-next"
    );
  } else if (pasteMatch) {
    setStatus(
      missionStatusEl,
      colorMode === MODE_ADVANCED
        ? "コピー＆ペーストは成功です。4色ドット絵を完成させたらスクリーンショット提出の練習に進もう。"
        : "コピー＆ペーストは成功です。次は見本に合わせてドット絵を完成させよう。",
      "is-success"
    );
  } else {
    setStatus(
      missionStatusEl,
      colorMode === MODE_ADVANCED
        ? "パレットで4色を選び、ドット絵を描いてスクリーンショット提出の練習に進もう。"
        : "1の場所を黒くぬり、文を選んで Ctrl + C でコピーし、Ctrl + V でペーストしよう。",
      colorMode === MODE_ADVANCED ? "is-next" : "is-warning"
    );
  }
}
