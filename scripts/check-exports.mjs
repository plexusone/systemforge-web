// Checks that every package's entry points load the way a consumer loads
// them: each `import` target with import(), each `require` target with
// require(), and every other target exists. Run after the build.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..', 'packages');
const failures = [];

function targets(value, condition, out) {
  if (typeof value === 'string') {
    out.push({ condition, path: value });
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      // types and default inherit the loader of the condition they sit in
      const next = key === 'import' || key === 'require' ? key : condition;
      targets(v, key === 'types' ? 'types' : next, out);
    }
  }
  return out;
}

for (const name of readdirSync(root)) {
  const dir = join(root, name);
  const pkgFile = join(dir, 'package.json');
  if (!existsSync(pkgFile)) continue;
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  if (pkg.private) continue;

  const checks = targets(pkg.exports ?? {}, 'file', []);
  for (const field of ['main', 'module', 'types']) {
    if (pkg[field]) checks.push({ condition: 'file', path: pkg[field], field });
  }

  for (const { condition, path, field } of checks) {
    const file = join(dir, path);
    const where = `${pkg.name} ${field ?? condition} ${path}`;
    if (!existsSync(file)) {
      failures.push(`${where}: missing`);
      continue;
    }
    try {
      if (condition === 'import') await import(pathToFileURL(file).href);
      // In a CommonJS process, as a CommonJS consumer loads it; requiring
      // from this ES module would load some dependencies differently.
      if (condition === 'require') {
        execFileSync(process.execPath, ['-e', `require(${JSON.stringify(file)})`], {
          // From the package's directory, where its dependencies resolve
          // as they do once installed.
          cwd: dir,
          stdio: ['ignore', 'ignore', 'pipe'],
        });
      }
    } catch (err) {
      const detail = err.stderr ? String(err.stderr) : err.message;
      const line = detail.split('\n').find((l) => /Error/.test(l)) ?? detail.split('\n')[0];
      failures.push(`${where}: ${line.trim()}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Package entry points that do not load:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Every package entry point loads.');
