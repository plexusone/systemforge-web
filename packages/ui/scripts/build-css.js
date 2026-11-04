#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, '..');
const srcCss = resolve(rootDir, 'src', 'globals.css');
const distDir = resolve(rootDir, 'dist');
const distCss = resolve(distDir, 'globals.css');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build CSS with Tailwind v4 via PostCSS
console.log('Building CSS with Tailwind v4...');
// Run postcss-cli's script with this Node, from an argument list rather
// than a shell string, so the checkout path is never read by a shell.
const require = createRequire(import.meta.url);
const pkgFile = require.resolve('postcss-cli/package.json');
const bin = require(pkgFile).bin;
const postcss = resolve(dirname(pkgFile), typeof bin === 'string' ? bin : bin.postcss);
execFileSync(process.execPath, [postcss, srcCss, '-o', distCss], {
  cwd: rootDir,
  stdio: 'inherit',
});

console.log('CSS built successfully!');
