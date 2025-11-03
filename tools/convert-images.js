#!/usr/bin/env node
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const images = [
  'Pngs/amex store.png',
  'Pngs/valorant aim color.png',
  'Pngs/VALORANT BYPASS.png',
  'Pngs/VALORANT NFA.png',
  'Pngs/LEAGUEOFMENU.png',
  'Pngs/VAVAALE.png'
];

async function ensureOptimizedAssets() {
  const results = [];

  for (const relativePath of images) {
    const inputPath = resolve(projectRoot, relativePath);
    const baseOutputPath = inputPath.replace(/\.[^.]+$/, '');

    const image = sharp(inputPath, { failOn: 'warning' });
    const metadata = await image.metadata();

    await image
      .clone()
      .webp({ quality: 82, effort: 5 })
      .toFile(`${baseOutputPath}.webp`);

    await image
      .clone()
      .avif({ quality: 55, effort: 5 })
      .toFile(`${baseOutputPath}.avif`);

    results.push({
      file: relativePath,
      width: metadata.width,
      height: metadata.height,
      webp: `${relativePath.replace(/\.[^.]+$/, '')}.webp`,
      avif: `${relativePath.replace(/\.[^.]+$/, '')}.avif`
    });
  }

  console.table(results.map(({ file, width, height }) => ({ file, width, height })));
}

ensureOptimizedAssets().catch((error) => {
  console.error('Falha ao otimizar imagens:', error);
  process.exitCode = 1;
});
