import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const targets = [
  { file: 'apple-touch-icon.png', size: 180, padding: 0.12 },
  { file: 'icon-192.png', size: 192, padding: 0.12 },
  { file: 'icon-512.png', size: 512, padding: 0.12 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0 },
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, padding } of targets) {
  const inner = svg.replace('viewBox="0 0 108 108"', `viewBox="${-108 * padding / 2} ${-108 * padding / 2} ${108 * (1 + padding)} ${108 * (1 + padding)}"`)
    .replace('<rect width="108" height="108"', `<rect x="${-108 * padding}" y="${-108 * padding}" width="${108 * (1 + 2 * padding)}" height="${108 * (1 + 2 * padding)}"`);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${inner.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: false });
}
await browser.close();
