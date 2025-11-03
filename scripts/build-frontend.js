import { build } from 'esbuild';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdir, rm } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const outdir = resolve(projectRoot, 'assets/js');

export const buildFrontend = async () => {
  await rm(outdir, { recursive: true, force: true }).catch(() => {});
  await mkdir(outdir, { recursive: true });

  await build({
    entryPoints: [
      resolve(projectRoot, 'script.js'),
      resolve(projectRoot, 'scripts/account-page.js')
    ],
    outdir,
    bundle: true,
    format: 'esm',
    sourcemap: true,
    minify: true,
    target: ['es2017'],
    entryNames: '[name]',
    treeShaking: true,
    logLevel: 'info'
  });
};

export const run = async () => {
  try {
    await buildFrontend();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
};

if (import.meta.url === process.argv[1] || import.meta.url === ile://) {
  run();
}

