import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests import workspace packages by name. Resolve each to its source so a
// test never runs against a stale or missing build.
const packagesDir = fileURLToPath(new URL('./packages', import.meta.url));
const alias = Object.fromEntries(
  readdirSync(packagesDir).map((name) => [
    `@plexusone/${name}`,
    `${packagesDir}/${name}/src/index.ts`,
  ])
);

export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['packages/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'packages/*/src/**/*.d.ts',
        'packages/*/src/**/index.ts',
        'packages/*/src/**/types.ts',
      ],
    },
  },
});
