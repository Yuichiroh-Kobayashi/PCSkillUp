function createBitmapBytes(src, options) {
  const { width, bitCount } = options;
  const height = width;
  const palette = bitCount === 4 ? createFourShadePaletteFor4bppBmp() : createMonoPaletteFor1bppBmp();
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
    if (bitCount === 4) {
      write4BitRow(bytes, rowOffset, src[sourceY]);
    } else {
      write1BitRow(bytes, rowOffset, src[sourceY]);
    }
  }

  return bytes;
}

function createMonoPaletteFor1bppBmp() {
  return [
    [255, 255, 255],
    [0, 0, 0]
  ];
}

function createFourShadePaletteFor4bppBmp() {
  // Windows Paint compatibility is important, so advanced mode exports a 4bpp indexed BMP.
  // The teaching model uses 4 colors, while 4bpp BMP can address up to 16 palette entries.
  // Repeating the 4 shades keeps the file small and keeps all possible 4bpp indexes valid.
  const shades = [
    [255, 255, 255],
    [192, 192, 192],
    [105, 105, 105],
    [0, 0, 0]
  ];
  return Array.from({ length: 16 }, (_, i) => shades[i % shades.length]);
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
