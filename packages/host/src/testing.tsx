import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { render, type RenderResult } from '@testing-library/react';
import { SessionProvider, type WireSession } from '@plexusone/auth';
import { HostRoutes } from './createHost';
import { devSession, devSessionClient } from './devSession';
import type { AppModule, Shell } from './types';

/** Options for renderApp. */
export interface RenderAppOptions {
  /** The session. Default devSession(app). */
  session?: WireSession;
  /** The URL to open. Default `/`, which opens the first organization. */
  path?: string;
  /** The shell. Default DevShell. */
  shell?: Shell;
}

/**
 * renderApp renders an application as createHost would, in a memory router
 * with a fixture session, for the application's own tests.
 */
export function renderApp(app: AppModule, options: RenderAppOptions = {}): RenderResult {
  const client = devSessionClient(options.session ?? devSession(app));
  const ui: ReactNode = (
    <SessionProvider client={client} refreshInterval={0} refreshOnFocus={false}>
      <MemoryRouter initialEntries={[options.path ?? '/']}>
        <HostRoutes app={app} shell={options.shell} />
      </MemoryRouter>
    </SessionProvider>
  );
  return render(ui);
}

/**
 * conformanceProblems lists what keeps app from being hostable: an empty ID
 * or name, no routes, or no home (index) route. Empty when it conforms.
 */
export function conformanceProblems(app: AppModule): string[] {
  const problems: string[] = [];
  if (!app.id.trim()) problems.push('id is empty');
  if (!app.name.trim()) problems.push('name is empty');
  if (app.routes.length === 0) problems.push('routes is empty');
  else if (!app.routes.some((r) => r.index || r.path === '' || r.path === '/')) {
    problems.push('routes has no index route for the organization home');
  }
  return problems;
}
