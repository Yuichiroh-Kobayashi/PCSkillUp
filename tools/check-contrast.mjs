#!/usr/bin/env node
// Test-time only. No runtime dependency is added to docs/.
// Parses docs/styles.css, checks that the two dark token blocks stay identical,
// and reports contrast ratios for the key token pairs in both themes.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "docs", "styles.css"), "utf8");

function blockAfter(marker) {
  const at = css.indexOf(marker);
  if (at === -1) throw new Error(`marker not found: ${marker}`);
  // Markers sit just inside the opening brace, so read up to the closing brace.
  const close = css.indexOf("}", at);
  if (close === -1) throw new Error(`unterminated block: ${marker}`);
  return css.slice(at + marker.length, close);
}

function parseTokens(block) {
  const tokens = {};
  for (const line of block.split("\n")) {
    const m = line.match(/(--[\w-]+)\s*:\s*([^;]+);/);
    if (m) tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

const shared = parseTokens(blockAfter("/* @tokens:shared */"));
const light = { ...shared, ...parseTokens(blockAfter("/* @tokens:light */")) };
const darkMedia = parseTokens(blockAfter("/* @tokens:dark-media */"));
const darkAttr = parseTokens(blockAfter("/* @tokens:dark-attr */"));
const dark = { ...shared, ...darkAttr };

let failures = 0;

// 1. The two dark blocks must stay in sync (media query + manual override).
const keys = new Set([...Object.keys(darkMedia), ...Object.keys(darkAttr)]);
const drift = [...keys].filter((k) => darkMedia[k] !== darkAttr[k]);
if (drift.length) {
  failures++;
  console.log("FAIL dark token blocks differ:", drift.join(", "));
} else {
  console.log(`OK   dark token blocks identical (${keys.size} tokens)`);
}
// Every light token must have a dark counterpart: same roles, different values.
const missing = Object.keys(light).filter((k) => !(k in dark));
if (missing.length) {
  failures++;
  console.log("FAIL roles missing from dark theme:", missing.join(", "));
} else {
  console.log(`OK   every semantic role exists in both themes (${Object.keys(light).length})`);
}

function toRgb(value, theme) {
  let v = String(value).trim();
  let guard = 0;
  while (v.startsWith("var(") && guard++ < 8) {
    const name = v.slice(4, v.indexOf(")")).trim();
    v = String(theme[name] ?? "").trim();
  }
  const rgba = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const p = rgba[1].split(",").map((n) => parseFloat(n));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  }
  const hex = v.replace("#", "");
  if (hex.length === 3) {
    return { rgb: [...hex].map((c) => parseInt(c + c, 16)), a: 1 };
  }
  if (hex.length !== 6) throw new Error(`cannot parse color: ${value}`);
  return { rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)), a: 1 };
}

function over(fg, bg) {
  if (fg.a === 1) return fg.rgb;
  return fg.rgb.map((c, i) => c * fg.a + bg[i] * (1 - fg.a));
}

function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// [label, foreground token, background token(s), target ratio, kind]
const PAIRS = [
  ["page text / page bg", "--color-text", ["--color-page-bg"], 4.5, "text"],
  ["surface text / surface", "--color-text", ["--color-surface"], 4.5, "text"],
  ["muted text / surface", "--color-text-muted", ["--color-surface"], 4.5, "text"],
  ["muted text / page bg", "--color-text-muted", ["--color-page-bg"], 4.5, "text"],
  ["primary button text / bg", "--color-action-primary-fg", ["--color-action-primary-bg"], 4.5, "text"],
  ["secondary button text / bg", "--color-action-secondary-fg", ["--color-action-secondary-bg"], 4.5, "text"],
  ["success fg / success bg", "--color-status-success-fg", ["--color-status-success-bg"], 4.5, "text"],
  ["warning fg / warning bg", "--color-status-warning-fg", ["--color-status-warning-bg"], 4.5, "text"],
  ["CLEAR text / CLEAR surface", "--color-clear-text", ["--color-clear-surface"], 4.5, "text"],
  ["CLEAR accent / CLEAR surface", "--color-clear-accent", ["--color-clear-surface"], 4.5, "text"],
  ["key text / key bg", "--color-key-fg", ["--color-key-bg"], 4.5, "text"],
  ["stage label / stage board", "--color-stage-label", ["--color-stage-bg"], 4.5, "text"],
  ["stage accent text / surface", "--color-stage-accent", ["--color-surface"], 4.5, "text"],
  ["stage accent chip text / chip", "--color-stage-accent-fg", ["--color-stage-accent"], 4.5, "text"],

  ["complete text / surface", "--color-complete-text", ["--color-surface"], 4.5, "text"],
  ["complete text / page bg", "--color-complete-text", ["--color-page-bg"], 4.5, "text"],

  ["surface border / page bg", "--color-border", ["--color-page-bg"], 3, "ui"],
  ["complete border / page bg", "--color-complete-border", ["--color-page-bg"], 3, "ui"],
  ["complete border / surface", "--color-complete-border", ["--color-surface"], 3, "ui"],
  ["complete accent / page bg", "--color-complete-accent", ["--color-page-bg"], 3, "ui"],
  ["stage board / page bg", "--color-stage-bg", ["--color-page-bg"], 3, "ui"],
  ["stage board / data black", "--color-stage-bg", ["--color-data-black"], 3, "ui"],
  ["stage board / data white", "--color-stage-bg", ["--color-data-white"], 3, "ui"],
  ["stage border / surface", "--color-stage-border", ["--color-surface"], 3, "ui"],
  ["key border / surface", "--color-key-border", ["--color-surface"], 3, "ui"],
  ["success border / surface", "--color-status-success-border", ["--color-status-success-bg"], 3, "ui"],
  ["warning border / surface", "--color-status-warning-border", ["--color-status-warning-bg"], 3, "ui"],
  ["primary button border / page bg", "--color-action-primary-border", ["--color-page-bg"], 3, "ui"],
  ["secondary button border / bg", "--color-action-secondary-border", ["--color-action-secondary-bg"], 3, "ui"],
  ["focus outer / page bg", "--color-focus-outer", ["--color-page-bg"], 3, "ui"],
  ["focus outer / surface", "--color-focus-outer", ["--color-surface"], 3, "ui"],
  ["focus outer / focus inner", "--color-focus-outer", ["--color-focus-inner"], 3, "ui"],
  ["clear accent line / clear surface", "--color-clear-accent-line", ["--color-clear-surface"], 3, "ui"],
  ["effect primary / clear surface", "--color-effect-primary", ["--color-clear-surface"], 3, "ui"],
  ["effect secondary / clear surface", "--color-effect-secondary", ["--color-clear-surface"], 3, "ui"],
  ["effect highlight / clear surface", "--color-effect-highlight", ["--color-clear-surface"], 3, "ui"],
];

// Data colors are lesson data, never re-themed: check the ink that sits on them once.
const DATA_PAIRS = [
  ["hint 1 / data white", "--color-data-hint", "--color-data-white", 4.5],
  ["cell ink / data white", "--color-data-ink", "--color-data-white", 4.5],
  ["cell ink / data silver", "--color-data-ink", "--color-data-silver", 4.5],
  ["cell ink inverse / data gray", "--color-data-ink-inverse", "--color-data-gray", 4.5],
  ["cell ink inverse / data black", "--color-data-ink-inverse", "--color-data-black", 4.5],
];

function report(name, theme) {
  console.log(`\n--- ${name} ---`);
  for (const [label, fgToken, bgTokens, target, kind] of PAIRS) {
    const base = toRgb(theme[bgTokens[0]], theme);
    const bg = over(base, [255, 255, 255]);
    const fg = over(toRgb(theme[fgToken], theme), bg);
    const ratio = contrast(fg, bg);
    const ok = ratio >= target;
    if (!ok) failures++;
    console.log(
      `${ok ? "OK  " : "FAIL"} ${ratio.toFixed(2).padStart(5)}:1  (target ${target} ${kind})  ${label}`
    );
  }
}

report("light", light);
report("dark", dark);

console.log("\n--- lesson data colors (identical in both themes) ---");
for (const [label, fgToken, bgToken, target] of DATA_PAIRS) {
  const bg = toRgb(shared[bgToken], shared).rgb;
  const fg = toRgb(shared[fgToken], shared).rgb;
  const ratio = contrast(fg, bg);
  const ok = ratio >= target;
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FAIL"} ${ratio.toFixed(2).padStart(5)}:1  (target ${target})  ${label}`);
}

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) below target.`}`);
process.exit(failures === 0 ? 0 : 1);
