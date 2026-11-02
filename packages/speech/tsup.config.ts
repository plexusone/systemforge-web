import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', react: 'src/react.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react'],
  },
  {
    // One file for pages without a build step: a script tag, or a page
    // served by a Go program that embeds it. Exposes window.PlexusSpeech.
    entry: { speech: 'src/index.ts' },
    format: ['iife'],
    globalName: 'PlexusSpeech',
    minify: true,
    sourcemap: false,
    clean: false,
  },
]);
