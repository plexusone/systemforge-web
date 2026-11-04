// Keeps local filesystem paths out of published packages.
//
//   node scripts/dist-paths.mjs fix [pkgDir...]    rewrite absolute paths in dist/*.map
//   node scripts/dist-paths.mjs check [pkgDir...]  fail if dist names an absolute path
//
// With no package directories, both act on every package. tsup's CJS output
// with code splitting writes source maps whose `file` and first `sources`
// entry are absolute, which would publish the build machine's home directory.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const toPosix = (p) => p.split(sep).join('/');

/** Rewrites absolute `file` and `sources` entries in dist's source maps to relative ones. */
export function relativizeSourceMaps(distDir) {
  for (const mapFile of files(distDir).filter((f) => f.endsWith('.map'))) {
    const map = JSON.parse(readFileSync(mapFile, 'utf8'));
    const from = dirname(mapFile);
    let changed = false;
    if (typeof map.file === 'string' && isAbsolute(map.file)) {
      map.file = toPosix(relative(from, map.file));
      changed = true;
    }
    if (Array.isArray(map.sources)) {
      map.sources = map.sources.map((s) => {
        if (typeof s !== 'string' || !isAbsolute(s)) return s;
        changed = true;
        return toPosix(relative(from, s));
      });
    }
    if (changed) writeFileSync(mapFile, JSON.stringify(map));
  }
}

// The repository's own location, and any home directory on macOS, Linux or Windows.
const LEAKS = [
  { name: 'repository path', test: (s) => s.includes(repoRoot) },
  { name: 'home directory', test: (s) => /(^|["'\s(])\/(Users|home)\/[^/"'\s]+\//.test(s) },
  { name: 'home directory', test: (s) => /[A-Za-z]:\\\\?Users\\\\?[^\\"'\s]+/.test(s) },
];

/** Returns "file: kind" for each dist file that names a local path. */
export function findLeaks(distDir) {
  const found = [];
  for (const f of files(distDir)) {
    const text = readFileSync(f, 'utf8');
    for (const leak of LEAKS) {
      if (leak.test(text)) {
        found.push(`${toPosix(relative(repoRoot, f))}: ${leak.name}`);
        break;
      }
    }
  }
  return found;
}

function packageDirs(args) {
  if (args.length > 0) return args.map((a) => resolve(a));
  const root = join(repoRoot, 'packages');
  return readdirSync(root)
    .map((n) => join(root, n))
    .filter((d) => existsSync(join(d, 'package.json')));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  const dirs = packageDirs(args);
  if (cmd === 'fix') {
    for (const d of dirs) relativizeSourceMaps(join(d, 'dist'));
  } else if (cmd === 'check') {
    const leaks = dirs.flatMap((d) => findLeaks(join(d, 'dist')));
    if (leaks.length > 0) {
      console.error('Local paths in build output:\n  ' + leaks.join('\n  '));
      process.exit(1);
    }
    console.log('No local paths in build output.');
  } else {
    console.error('usage: dist-paths.mjs fix|check [pkgDir...]');
    process.exit(2);
  }
}
