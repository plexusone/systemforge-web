import { defineConfig } from 'tsup';
// @ts-expect-error: a plain JavaScript build script, without types
import { relativizeSourceMaps } from '../../scripts/dist-paths.mjs';

export default defineConfig({
  // The card and the scanner have no framework, so a page without React (a
  // game, say) loads them alone; react and scanner/react add the components.
  entry: {
    index: 'src/index.ts',
    react: 'src/react.tsx',
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
