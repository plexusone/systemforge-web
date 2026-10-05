#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
execSync(`npx postcss ${srcCss} -o ${distCss}`, { cwd: rootDir, stdio: 'inherit' });

console.log('CSS built successfully!');
