#!/usr/bin/env node
// Generates Android adaptive launcher icon PNGs from public/assets/images/logo.png
// Uses sharp (indirectly via dynamic import) to rasterize at required sizes.
// Foreground is scaled with padding; background color comes from ic_launcher_background.xml.
// NOTE: Run after installing dev dependency: npm i -D sharp
// Usage: node scripts/generateIcons.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root = path.resolve(__dirname, '..');
const SRC_IMG = path.join(__root, 'public', 'assets', 'images', 'logo.png');
const RES_DIR = path.join(__root, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(SRC_IMG)) {
  console.error('✖ logo.png not found at', SRC_IMG);
  process.exit(1);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('✖ sharp not installed. Install with: npm i -D sharp');
  process.exit(1);
}

// Standard Android launcher icon pixel sizes per density (square)
// adaptive foreground recommended size is 432x432 inside a 512x512 (will auto mask).
// We'll generate transparent foreground PNGs sized 512 and let Android scale.
const densities = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// For adaptive icons, we mainly need ic_launcher_foreground.png in each mipmap-* folder.
// We'll center the SVG with 12% padding.

const paddingRatio = 0.12; // 12% padding of final size

async function generate() {
  const imgBuffer = fs.readFileSync(SRC_IMG);
  for (const d of densities) {
    const outDir = path.join(RES_DIR, d.folder);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const paddedSize = d.size;
    const inner = Math.round(paddedSize * (1 - paddingRatio * 2));

    // Render to inner then composite onto transparent canvas of final size to keep uniform padding.
  const rendered = await sharp(imgBuffer)
      .resize(inner, inner, { fit: 'contain' })
      .png()
      .toBuffer();

    const composite = await sharp({
      create: {
        width: paddedSize,
        height: paddedSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: rendered, gravity: 'center' }])
      .png()
      .toBuffer();

    const outFile = path.join(outDir, 'ic_launcher_foreground.png');
    fs.writeFileSync(outFile, composite);
    console.log('✓ Wrote', path.relative(__root, outFile));
  }
  console.log('✅ Icon foregrounds generated. Ensure adaptive XML references @mipmap/ic_launcher_foreground');
  console.log('   You may also want to recreate round variants if required (usually auto).');
}

generate().catch(err => {
  console.error('✖ Failed generating icons:', err);
  process.exit(1);
});
