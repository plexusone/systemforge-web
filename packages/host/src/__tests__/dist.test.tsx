import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

// The published entries, @plexusone/host and @plexusone/host/testing, are
// separate bundles. They must share one AppContext, or a page's
// useAppContext throws inside renderApp. Source-level tests share modules and
// cannot see this, so this test loads the build, building it first when CI
// runs the tests before the build.
const pkg = resolve(__dirname, '../..');
const dist = (name: string) => resolve(pkg, 'dist', name);

beforeAll(() => {
  if (!existsSync(dist('index.mjs')) || !existsSync(dist('testing.mjs'))) {
    execFileSync(resolve(pkg, 'node_modules/.bin/tsup'), { cwd: pkg, stdio: 'ignore' });
  }
}, 60_000);

describe('the built entries', () => {
  it('share the app context between @plexusone/host and @plexusone/host/testing', async () => {
    const host = await import(/* @vite-ignore */ dist('index.mjs'));
    const testing = await import(/* @vite-ignore */ dist('testing.mjs'));

    function Home() {
      const { organizationId } = host.useAppContext();
      return <h1>home of {organizationId}</h1>;
    }
    const app = { id: 'reports', name: 'Reports', routes: [{ index: true, element: <Home /> }] };

    testing.renderApp(app, { path: '/orgs/dev-org' });
    expect(await screen.findByRole('heading', { name: 'home of dev-org' })).toBeInTheDocument();
  });
});
