import { Navigate, Outlet } from 'react-router';
import type { AppModule } from '@plexusone/host';
import { Billing } from './pages/Billing';
import { Connect } from './pages/Connect';
import { Connections } from './pages/Connections';
import { Gallery } from './pages/Gallery';
import { ConsoleOptionsProvider, type ConsoleOptions } from './options';

/** The console's application ID, matching SystemAuth's console session. */
export const CONSOLE_APP_ID = 'console';

const org = (id: string) => `/orgs/${encodeURIComponent(id)}`;

/**
 * createConsoleApp is the organization console's pages, for createHost: an
 * organization's connections, a gallery of services to connect, a
 * step-by-step wizard for each, and the organization's plan and billing. Routes are relative to `/orgs/{id}/`.
 * options.nextSteps lets the host point a connection at the products that
 * use it, such as adding sites from a Cloudflare connection.
 */
export function createConsoleApp(options: ConsoleOptions = {}): AppModule {
  return {
    id: CONSOLE_APP_ID,
    name: 'Console',
    routes: [
      {
        path: '',
        element: (
          <ConsoleOptionsProvider value={options}>
            <Outlet />
          </ConsoleOptionsProvider>
        ),
        children: [
          { index: true, element: <Navigate replace to="connections" /> },
          { path: 'connections', element: <Connections /> },
          { path: 'connections/new', element: <Gallery /> },
          { path: 'connections/new/:provider', element: <Connect /> },
          { path: 'billing', element: <Billing /> },
        ],
      },
    ],
    navigation: ({ organizationId }) => [
      {
        title: 'Organization',
        items: [
          { id: 'connections', label: 'Connections', href: `${org(organizationId)}/connections` },
          ...(options.billing
            ? [{ id: 'billing', label: 'Billing', href: `${org(organizationId)}/billing` }]
            : []),
        ],
      },
    ],
  };
}

/** consoleApp is the console without next steps. */
export const consoleApp: AppModule = createConsoleApp();
