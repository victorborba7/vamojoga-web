/**
 * Gera splash screens para iOS usando apenas canvas nativo do Node.js.
 * Executa com: node scripts/generate-splashscreens.mjs
 *
 * Requer: npm install canvas
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../public/splashscreens");

// Cores do tema
const BG_COLOR = "#0F172A";
const ACCENT_COLOR = "#7c3aed";

const SIZES = [
  [1320, 2868], // iPhone 16 Pro Max
  [1206, 2622], // iPhone 16 Pro
  [1290, 2796], // iPhone 15 Plus / 14 Plus
  [1179, 2556], // iPhone 15 Pro / 14 Pro
  [1170, 2532], // iPhone 14 / 13 / 12
  [1242, 2688], // iPhone 11 Pro Max / XS Max
  [828, 1792],  // iPhone 11 / XR
  [1125, 2436], // iPhone X / XS / 11 Pro
  [1242, 2208], // iPhone 8 Plus / 7 Plus
  [750, 1334],  // iPhone SE / 8 / 7 / 6(s)
];

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const [w, h] of SIZES) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Fundo
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Círculo de destaque central
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.12;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, ACCENT_COLOR);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Texto
  const fontSize = Math.round(w * 0.055);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VamoJoga", cx, cy + radius * 1.6);

  const filename = `apple-splash-${w}-${h}.png`;
  writeFileSync(resolve(OUTPUT_DIR, filename), canvas.toBuffer("image/png"));
  console.log(`✔ Gerado: ${filename}`);
}

console.log("\nSplash screens gerados em public/splashscreens/");
