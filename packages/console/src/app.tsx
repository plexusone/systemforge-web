import { Navigate } from 'react-router';
import type { AppModule } from '@plexusone/host';
import { Connect } from './pages/Connect';
import { Connections } from './pages/Connections';
import { Gallery } from './pages/Gallery';

/** The console's application ID, matching SystemAuth's console session. */
export const CONSOLE_APP_ID = 'console';

const org = (id: string) => `/orgs/${encodeURIComponent(id)}`;

/**
 * consoleApp is the organization console's pages, for createHost: an
 * organization's connections, a gallery of services to connect, and a
 * step-by-step wizard for each. Routes are relative to `/orgs/{id}/`.
 */
export const consoleApp: AppModule = {
  id: CONSOLE_APP_ID,
  name: 'Console',
  routes: [
    { index: true, element: <Navigate replace to="connections" /> },
    { path: 'connections', element: <Connections /> },
    { path: 'connections/new', element: <Gallery /> },
    { path: 'connections/new/:provider', element: <Connect /> },
  ],
  navigation: ({ organizationId }) => [
    {
      title: 'Organization',
      items: [
        { id: 'connections', label: 'Connections', href: `${org(organizationId)}/connections` },
      ],
    },
  ],
};
