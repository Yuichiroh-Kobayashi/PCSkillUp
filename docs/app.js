const PRACTICE_SIZE = 16;
const ADVANCED_SIZE = 32;
const COPY_TEXT = "ドット絵を完成させました";
const MODE_PRACTICE = "practice";
const MODE_ADVANCED = "advanced";
const COLOR_COUNT = {
  [MODE_PRACTICE]: 2,
  [MODE_ADVANCED]: 4
};
const patterns = [
  { name: "ハート", binary: [
    "0000000000000000","0000000000000000","0000110000110000","0001111001111000",
    "0011111111111100","0111111111111110","0111111111111110","0111111111111110",
    "0011111111111100","0001111111111000","0000111111110000","0000011111100000",
    "0000001111000000","0000000110000000","0000000000000000","0000000000000000"
  ], advanced: [
    "00000000000000000000000000000000","00000000000000000000000000000000",
    "00000000000000000000000000000000","00000000000000000000000000000000",
    "00000012333321000012333321000000","00001233333333211233333333210000",
    "00012333333333333333333333321000","00123333333333333333333333332100",
    "00123333333333333333333333332100","01233333333333333333333333333210",
    "01233333333333333333333333333210","01233333333333333333333333333210",
    "00123333333333333333333333332100","00123333333333333333333333332100",
    "00012333333333333333333333321000","00012333333333333333333333321000",
    "00001233333333333333333333210000","00000123333333333333333332100000",
    "00000012333333333333333321000000","00000001233333333333333210000000",
    "00000000123333333333332100000000","00000000012333333333321000000000",
    "00000000001233333333210000000000","00000000000123333332100000000000",
    "00000000000012333321000000000000","00000000000001233210000000000000",
    "00000000000000122100000000000000","00000000000000011000000000000000",
    "00000000000000000000000000000000","00000000000000000000000000000000",
    "00000000000000000000000000000000","00000000000000000000000000000000"
  ]},
  { name: "スマイル", binary: [
    "0000000000000000","0000000000000000","0000111111110000","0001100000011000",
    "0010000000000100","0100010000100010","0100010000100010","0100000000000010",
    "0100000000000010","0100100000010010","0100011111100010","0010000000000100",
    "0001100000011000","0000111111110000","0000000000000000","0000000000000000"
  ], advanced: [
    "00000000000000000000000000000000","00000000000000000000000000000000",
    "00000000000000000000000000000000","00000000000333333333300000000000",
    "00000000033000000000033000000000","00000000300000000000000300000000",
    "00000003000000000000000030000000","00000030000000000000000003000000",
    "00000300000000000000000000300000","00000300000000000000000000300000",
    "00003000000000000000000000030000","00003000000330000003300000030000",
    "00030000000330000003300000003000","00030000000330000003300000003000",
    "00300000000330000003300000000300","00300000000330000003300000000300",
    "00300000000000000000000000000300","00300003000000000000000030000300",
    "00030003000000000000000030003000","00030000300000000000000300003000",
    "00003000030000000000003000030000","00003000003000000000030000030000",
    "00000300000330000003300000300000","00000300000003333330000000300000",
    "00000030000000000000000003000000","00000003000000000000000030000000",
    "00000000300000000000000300000000","00000000033000000000033000000000",
    "00000000000333333333300000000000","00000000000000000000000000000000",
    "00000000000000000000000000000000","00000000000000000000000000000000"
  ]},
  { name: "スター", binary: [
    "0000000000000000","0000000000000000","0000000100000000","0000001110000000",
    "0000001110000000","0000011111000000","0111111111111110","0011111111111100",
    "0001111111111000","0000111111110000","0001111111111000","0011111001111100",
    "0111100000111110","0010000000000100","0000000000000000","0000000000000000"
  ], advanced: [
    "00000000000000000000000000000000","00000000000000000000000000000000",
    "00000000000000020000000000000000","00000000000000030000000000000000",
    "00000000000000232000000000000000","00000000000000333000000000000000",
    "00000000000001333100000000000000","00000000000002333200000000000000",
    "00000000000003333300000000000000","00000000000023333320000000000000",
    "00000000000023333320000000000000","00122222223333333333322222221000",
    "00023333333333333333333333320000","00002333333333333333333333200000",
    "00000133333333333333333331000000","00000013333333333333333310000000",
    "00000000233333333333332000000000","00000000023333333333320000000000",
    "00000000023333333333320000000000","00000000023333333333320000000000",
    "00000000033333333333330000000000","00000000033333333333330000000000",
    "00000000233333202333332000000000","00000000233331000133332000000000",
    "00000000333200000002333000000000","00000001321000000000123100000000",
    "00000002200000000000002200000000","00000000000000000000000000000000",
    "00000000000000000000000000000000","00000000000000000000000000000000",
    "00000000000000000000000000000000","00000000000000000000000000000000"
  ]}
];

let patternIndex = 0;
let colorMode = MODE_PRACTICE;
let grid = createEmpty();
let isDragging = false;
let dragPaintValue = 1;
let selectedColor = 3;

const targetGridEl = document.getElementById("targetGrid");
const editGridEl = document.getElementById("editGrid");
const patternNameEl = document.getElementById("patternName");
const pasteAreaEl = document.getElementById("pasteArea");
const pasteStatusEl = document.getElementById("pasteStatus");
const missionStatusEl = document.getElementById("missionStatus");
const copySourceEl = document.getElementById("copySource");
const modeBtnEl = document.getElementById("modeBtn");
const paletteEl = document.getElementById("palette");
const swatchEls = Array.from(document.querySelectorAll(".swatch"));

copySourceEl.value = COPY_TEXT;
modeBtnEl.addEventListener("click", toggleMode);
swatchEls.forEach((swatch) => swatch.addEventListener("click", selectColor));
document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("nextBtn").addEventListener("click", nextPattern);
document.getElementById("downloadBtn").addEventListener("click", downloadBitmap);
pasteAreaEl.addEventListener("input", updateStatuses);
document.addEventListener("mouseup", () => { isDragging = false; });

renderTarget();
renderEditor();
renderPalette();
updateStatuses();

function getGridSize() { return colorMode === MODE_ADVANCED ? ADVANCED_SIZE : PRACTICE_SIZE; }
function getHexLabels() {
  return Array.from({ length: getGridSize() }, (_, i) => i.toString(16).toUpperCase().padStart(colorMode === MODE_ADVANCED ? 2 : 1, "0"));
}
function createEmpty() {
  const size = getGridSize();
  return Array.from({ length: size }, () => Array(size).fill(0));
}
function getTarget() {
  const pattern = patterns[patternIndex][colorMode === MODE_ADVANCED ? "advanced" : "binary"];
  return pattern.map((row) => row.split("").map(Number));
}

function renderTarget() {
  targetGridEl.innerHTML = "";
  targetGridEl.className = `grid ${colorMode === MODE_ADVANCED ? "advanced-grid" : "practice-grid"}`;
  patternNameEl.textContent = `${patterns[patternIndex].name}・${colorMode === MODE_ADVANCED ? "上級モード" : "練習モード"}`;
  const target = getTarget();
  renderCoordinateLabels(targetGridEl);
  const labels = getHexLabels();
  target.forEach((row, r) => {
    targetGridEl.appendChild(axisLabel(labels[r]));
    row.forEach((v, c) => targetGridEl.appendChild(cell(v, false, false, r, c)));
  });
}

function renderEditor() {
  editGridEl.innerHTML = "";
  editGridEl.className = `grid ${colorMode === MODE_ADVANCED ? "advanced-grid" : "practice-grid"}`;
  const target = getTarget();
  renderCoordinateLabels(editGridEl);
  const labels = getHexLabels();
  const size = getGridSize();
  for (let r = 0; r < size; r++) {
    editGridEl.appendChild(axisLabel(labels[r]));
    for (let c = 0; c < size; c++) {
      const showHint = colorMode === MODE_PRACTICE && target[r][c] === 1 && grid[r][c] === 0;
      const d = cell(grid[r][c], true, showHint, r, c);
      d.dataset.r = String(r);
      d.dataset.c = String(c);
      d.addEventListener("mousedown", onDown);
      d.addEventListener("mouseenter", onEnter);
      editGridEl.appendChild(d);
    }
  }
}

function renderCoordinateLabels(gridEl) {
  gridEl.appendChild(axisLabel(""));
  getHexLabels().forEach((label) => gridEl.appendChild(axisLabel(label)));
}

function axisLabel(label) {
  const d = document.createElement("div");
  d.className = "axis-label";
  d.textContent = label;
  return d;
}

function cell(value, editable, showHint, r, c) {
  const d = document.createElement("div");
  const labels = getHexLabels();
  const shade = colorMode === MODE_PRACTICE && value === 1 ? 3 : value;
  d.className = `cell shade-${shade}${showHint ? " hint" : ""}`;
  d.setAttribute("aria-label", `${labels[c]},${labels[r]}`);
  if (editable && showHint) d.textContent = "1";
  return d;
}

function onDown(e) {
  const r = Number(e.target.dataset.r);
  const c = Number(e.target.dataset.c);
  dragPaintValue = colorMode === MODE_ADVANCED ? selectedColor : (grid[r][c] + 1) % COLOR_COUNT[colorMode];
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

function clearAll() {
  grid = createEmpty();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  renderEditor();
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
  grid = createEmpty();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  modeBtnEl.textContent = colorMode === MODE_ADVANCED ? "練習モードにする" : "上級モードにする";
  renderTarget();
  renderEditor();
  renderPalette();
  updateStatuses();
}

function nextPattern() {
  patternIndex = (patternIndex + 1) % patterns.length;
  grid = createEmpty();
  pasteAreaEl.value = "";
  pasteStatusEl.textContent = "";
  missionStatusEl.textContent = "";
  renderTarget();
  renderEditor();
  updateStatuses();
}

function downloadBitmap() {
  const isAdvanced = colorMode === MODE_ADVANCED;
  const blob = new Blob([createBitmapBytes(grid, isAdvanced)], { type: "image/bmp" });
  const link = document.createElement("a");
  const modeName = isAdvanced ? "上級" : "練習";
  link.href = URL.createObjectURL(blob);
  link.download = `ドット絵_${patterns[patternIndex].name}_${modeName}.bmp`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function createBitmapBytes(src, isAdvanced) {
  const width = isAdvanced ? ADVANCED_SIZE : PRACTICE_SIZE;
  const height = width;
  const bitCount = isAdvanced ? 4 : 1;
  const palette = isAdvanced ? create16ColorPalette() : createMonoPalette();
  const rowBytes = Math.ceil((width * bitCount) / 8);
  const stride = Math.ceil(rowBytes / 4) * 4;
  const pixelOffset = 14 + 40 + palette.length * 4;
  const imageSize = stride * height;
  const fileSize = pixelOffset + imageSize;
  const bytes = new Uint8Array(fileSize);
  const view = new DataView(bytes.buffer);

  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, pixelOffset, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, bitCount, true);
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, palette.length, true);

  palette.forEach((color, i) => {
    const offset = 54 + i * 4;
    bytes[offset] = color[2];
    bytes[offset + 1] = color[1];
    bytes[offset + 2] = color[0];
    bytes[offset + 3] = 0;
  });

  for (let y = 0; y < height; y++) {
    const sourceY = height - 1 - y;
    const rowOffset = pixelOffset + y * stride;
    if (isAdvanced) {
      write4BitRow(bytes, rowOffset, src[sourceY]);
    } else {
      write1BitRow(bytes, rowOffset, src[sourceY]);
    }
  }

  return bytes;
}

function createMonoPalette() {
  return [
    [255, 255, 255],
    [0, 0, 0]
  ];
}

function create16ColorPalette() {
  return [
    [255, 255, 255],
    [207, 207, 207],
    [112, 112, 112],
    [17, 17, 17],
    [255, 255, 255],
    [207, 207, 207],
    [112, 112, 112],
    [17, 17, 17],
    [255, 255, 255],
    [207, 207, 207],
    [112, 112, 112],
    [17, 17, 17],
    [255, 255, 255],
    [207, 207, 207],
    [112, 112, 112],
    [17, 17, 17]
  ];
}

function write1BitRow(bytes, rowOffset, row) {
  row.forEach((value, x) => {
    if (!value) return;
    bytes[rowOffset + Math.floor(x / 8)] |= 0x80 >> (x % 8);
  });
}

function write4BitRow(bytes, rowOffset, row) {
  row.forEach((value, x) => {
    const offset = rowOffset + Math.floor(x / 2);
    const color = Math.max(0, Math.min(15, value));
    if (x % 2 === 0) {
      bytes[offset] |= color << 4;
    } else {
      bytes[offset] |= color;
    }
  });
}

function gridsMatch(a, b) {
  const size = getGridSize();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
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
    missionStatusEl.textContent = "ミッション完了！ドット絵を完成させ、Ctrl+C / Ctrl+V もできました。";
  } else if (targetMatch && !pasteMatch) {
    missionStatusEl.textContent = "ドット絵は完成です。次は文を選んで Ctrl+C、下の箱に Ctrl+V で貼り付けよう。";
  } else if (!targetMatch && pasteMatch) {
    missionStatusEl.textContent = "コピー＆貼り付けは成功です。次は見本に合わせてドット絵を完成させよう。";
  } else {
    missionStatusEl.textContent = colorMode === MODE_ADVANCED
      ? "見本と同じ上級モードの色にぬり、文を Ctrl+C / Ctrl+V で貼り付けよう。"
      : "1の場所を黒くぬり、文を Ctrl+C / Ctrl+V で貼り付けよう。";
  }
}
