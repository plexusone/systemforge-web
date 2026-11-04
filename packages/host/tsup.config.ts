import { defineConfig } from 'tsup';
// @ts-expect-error: a plain JavaScript build script, without types
import { relativizeSourceMaps } from '../../scripts/dist-paths.mjs';

export default defineConfig({
  entry: ['src/index.ts', 'src/testing.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  // Both entries share one copy of their common modules, so the React
  // context testing.renderApp provides is the one useAppContext reads.
  splitting: true,
  sourcemap: true,
  // Splitting with CJS output writes absolute paths into the source maps.
  onSuccess: async () => relativizeSourceMaps('dist'),
  clean: true,
  external: [
    'react',
    'react-dom',
    'react-router',
    '@plexusone/auth',
    '@plexusone/shell',
    '@testing-library/react',
  ],
});
