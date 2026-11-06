import { defineConfig } from 'tsup';
// @ts-expect-error: a plain JavaScript build script, without types
import { relativizeSourceMaps } from '../../scripts/dist-paths.mjs';

export default defineConfig({
  // The scanner has no framework, so a page without React (a game, say)
  // loads it alone; scanner/react adds the React component and hook.
  entry: {
    index: 'src/index.ts',
    scanner: 'src/scanner.ts',
    'scanner-react': 'src/scanner-react.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  // Splitting with CJS output writes absolute paths into the source maps.
  onSuccess: async () => relativizeSourceMaps('dist'),
  clean: true,
  external: ['react', 'react-dom'],
});
