import { defineConfig } from 'tsup';
// @ts-expect-error: a plain JavaScript build script, without types
import { relativizeSourceMaps } from '../../scripts/dist-paths.mjs';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', react: 'src/react.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    // One copy of the speech code shared by both entry points, so
    // stopSpeaking() and new speech see speech started through the hooks.
    splitting: true,
    sourcemap: true,
    // Splitting with CJS output writes absolute paths into the source maps.
    onSuccess: async () => relativizeSourceMaps('dist'),
    // Only this build's files: the two builds run at once, and cleaning
    // everything could delete the standalone build.
    clean: ['**/*', '!speech.global.js'],
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
