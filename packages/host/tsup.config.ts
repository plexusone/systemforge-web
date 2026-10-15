import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/testing.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  // Both entries share one copy of their common modules, so the React
  // context testing.renderApp provides is the one useAppContext reads.
  splitting: true,
  sourcemap: true,
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
