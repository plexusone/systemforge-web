import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests import workspace packages by name. Resolve each to its source so a
// test never runs against a stale or missing build.
const packagesDir = fileURLToPath(new URL('./packages', import.meta.url));
// Exact matches, so a subpath export such as @plexusone/host/testing gets
// its own entry instead of being appended to the package's index.
const alias = [
  { find: /^@plexusone\/host\/testing$/, replacement: `${packagesDir}/host/src/testing.tsx` },
  ...readdirSync(packagesDir).map((name) => ({
    find: new RegExp(`^@plexusone/${name}$`),
    replacement: `${packagesDir}/${name}/src/index.ts`,
  })),
];

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
