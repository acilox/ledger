// Render the source SVG (static/favicon.svg) into the PNG sizes the
// PWA + iOS need. Run with: node scripts/generate-icons.mjs

import { readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC = resolve(ROOT, 'static');

const svg = readFileSync(resolve(STATIC, 'favicon.svg'));

const renders = [
  { out: 'icon-192.png',          size: 192, bg: { r: 15, g: 23, b: 42, alpha: 1 } },
  { out: 'icon-512.png',          size: 512, bg: { r: 15, g: 23, b: 42, alpha: 1 } },
  { out: 'icon-maskable-512.png', size: 512, bg: { r: 15, g: 23, b: 42, alpha: 1 }, pad: 0.10 },
  { out: 'apple-touch-icon.png',  size: 180, bg: { r: 15, g: 23, b: 42, alpha: 1 } },
];

await mkdir(STATIC, { recursive: true });

for (const r of renders) {
  const innerSize = r.pad ? Math.round(r.size * (1 - r.pad * 2)) : r.size;
  const innerPng = await sharp(svg, { density: 512 })
    .resize(innerSize, innerSize, { fit: 'contain', background: r.bg })
    .png()
    .toBuffer();

  let final = innerPng;
  if (r.pad) {
    final = await sharp({
      create: { width: r.size, height: r.size, channels: 4, background: r.bg },
    })
      .composite([{ input: innerPng, gravity: 'center' }])
      .png()
      .toBuffer();
  }

  await writeFile(resolve(STATIC, r.out), final);
  console.log(`wrote static/${r.out} (${r.size}x${r.size}${r.pad ? `, ${Math.round(r.pad * 100)}% safe-area pad` : ''})`);
}

// OG social-share image, 1200x630. Rendered from static/og-image.svg — see
// docs/while-waiting-for-polar.md for the design intent.
const ogSvg = readFileSync(resolve(STATIC, 'og-image.svg'));
const ogPng = await sharp(ogSvg, { density: 200 })
  .resize(1200, 630, { fit: 'contain' })
  .png()
  .toBuffer();
await writeFile(resolve(STATIC, 'og-image.png'), ogPng);
console.log('wrote static/og-image.png (1200x630)');
