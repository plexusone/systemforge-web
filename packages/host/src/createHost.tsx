import { useEffect, useMemo, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useRoutes,
} from 'react-router';
import {
  SessionProvider,
  membershipFor,
  useSession,
  type SessionClient,
  type WireSession,
} from '@plexusone/auth';
import { AppContextProvider } from './context';
import { DevShell } from './DevShell';
import { devSession, devSessionClient } from './devSession';
import { NoAccessPage, NoOrganizationPage, NotFoundPage, SessionErrorPage } from './pages';
import type { AppContext, AppModule, Shell } from './types';

/** Options for createHost and HostRoutes. */
export interface HostOptions {
  /** The application to host. */
  app: AppModule;
  /** The chrome around it. Default DevShell. */
  shell?: Shell;
  /** The BFF client, when it is not at `/bff`. */
  sessionClient?: SessionClient;
  /**
   * Run without a backend: true for a default development session (see
   * devSession), or the session to use.
   */
  devSession?: boolean | WireSession;
  /**
   * The path the application is served under, such as `/console`. Routes,
   * links and navigation are relative to it. Default the site root.
   */
  basename?: string;
}

const orgPath = (organizationId: string, rest = '') =>
  `/orgs/${encodeURIComponent(organizationId)}${rest ? `/${rest.replace(/^\/+/, '')}` : ''}`;

/**
 * createHost returns an application's front end: the session, the router,
 * organization selection and the application's routes inside the shell.
 *
 * @example
 * ```tsx
 * createRoot(root).render(createHost({ app: reportsApp, shell: MyStackShell }));
 * ```
 */
export function createHost(options: HostOptions): ReactNode {
  return (
    <HostSession options={options}>
      <BrowserRouter basename={options.basename}>
        <HostRoutes app={options.app} shell={options.shell} />
      </BrowserRouter>
    </HostSession>
  );
}

/** The session createHost provides: the BFF's, or a development session. */
export function HostSession({
  options,
  children,
}: {
  options: HostOptions;
  children: ReactNode;
}): ReactNode {
  const { app, sessionClient, devSession: dev } = options;
  const client = useMemo(() => {
    if (dev) return devSessionClient(dev === true ? devSession(app) : dev);
    return sessionClient;
  }, [app, sessionClient, dev]);
  return <SessionProvider client={client}>{children}</SessionProvider>;
}

/**
 * HostRoutes is createHost's routing, for use inside a router and a
 * SessionProvider the caller provides (tests use a memory router).
 */
export function HostRoutes({
  app,
  shell = DevShell,
}: {
  app: AppModule;
  shell?: Shell;
}): ReactNode {
  const { status, error, signIn } = useSession();
  const mustSignIn = status === 'unauthenticated';
  useEffect(() => {
    if (mustSignIn) signIn();
  }, [mustSignIn, signIn]);

  if (status === 'loading' || status === 'unauthenticated') return null;
  if (status === 'error') return <SessionErrorPage message={error?.message} />;

  return (
    <Routes>
      <Route index element={<ChooseOrganization app={app} />} />
      <Route path="orgs/:org/*" element={<OrganizationScope app={app} shell={shell} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

/** Sends the person to the first organization they hold a role in this application in. */
function ChooseOrganization({ app }: { app: AppModule }): ReactNode {
  const { session } = useSession();
  const first = session.user?.memberships.find((m) => m.applications[app.id]);
  if (!first) return <NoOrganizationPage appName={app.name} />;
  return <Navigate replace to={orgPath(first.organizationId)} />;
}

/** The application inside the shell, for the organization in the URL. */
function OrganizationScope({
  app,
  shell: ShellComponent,
}: {
  app: AppModule;
  shell: Shell;
}): ReactNode {
  const { org = '' } = useParams();
  const { session } = useSession();
  const routerNavigate = useNavigate();
  const membership = membershipFor(session, org);
  const role = membership?.applications[app.id];

  const context = useMemo<AppContext>(
    () => ({
      organizationId: org,
      role,
      navigate: (path: string) => routerNavigate(orgPath(org, path)),
    }),
    [org, role, routerNavigate]
  );

  // Another organization's URL looks the same as one that does not exist.
  if (!membership) return <NotFoundPage />;

  return (
    <AppContextProvider value={context}>
      <ShellComponent
        app={app}
        context={context}
        onOrganizationChange={(id) => routerNavigate(orgPath(id))}
      >
        {role ? <AppRoutes app={app} /> : <NoAccessPage appName={app.name} />}
      </ShellComponent>
    </AppContextProvider>
  );
}

function AppRoutes({ app }: { app: AppModule }): ReactNode {
  return useRoutes([...app.routes, { path: '*', element: <NotFoundPage /> }]);
}
