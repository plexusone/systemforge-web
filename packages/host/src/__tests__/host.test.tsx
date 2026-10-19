import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SessionClient, SessionProvider } from '@plexusone/auth';
import { HostRoutes, createHost } from '../createHost';
import { useAppContext } from '../context';
import { devSession } from '../devSession';
import { conformanceProblems, renderApp } from '../testing';
import type { AppModule, Shell } from '../types';

function Home() {
  const { organizationId, role, navigate } = useAppContext();
  return (
    <div>
      <h1>Reports home</h1>
      <p>
        org {organizationId}, role {role}
      </p>
      <button onClick={() => navigate('reports/7')}>Open report</button>
    </div>
  );
}

function Report() {
  const { organizationId } = useAppContext();
  return <h1>Report 7 in {organizationId}</h1>;
}

const reportsApp: AppModule = {
  id: 'reports',
  name: 'Reports',
  routes: [
    { index: true, element: <Home /> },
    { path: 'reports/:id', element: <Report /> },
  ],
  navigation: (ctx) => [
    { items: [{ id: 'home', label: 'Home', href: `/orgs/${ctx.organizationId}` }] },
  ],
};

const twoOrgs = devSession(reportsApp, {
  organizations: [
    { id: 'org-1', name: 'Acme', role: 'editor' },
    { id: 'org-2', name: 'Side' },
  ],
  otherApps: [{ id: 'agents', name: 'Agents', url: 'https://agents.example.com' }],
});

describe('createHost routing', () => {
  it('opens the first organization the person holds a role in, inside the shell', async () => {
    renderApp(reportsApp, { session: twoOrgs });
    expect(await screen.findByRole('heading', { name: 'Reports home' })).toBeInTheDocument();
    expect(screen.getByText('org org-1, role editor')).toBeInTheDocument();
    // DevShell: the app's name as brand, the switchers, the profile menu.
    expect(screen.getByRole('navigation', { name: 'Products' })).toHaveTextContent('ReportsAgents');
    expect(screen.getByRole('button', { name: 'Switch organization' })).toHaveTextContent('Acme');
    expect(screen.getByRole('button', { name: /^Account/ })).toBeInTheDocument();
  });

  it('navigates within the organization from a page', async () => {
    renderApp(reportsApp, { session: twoOrgs, path: '/orgs/org-1' });
    fireEvent.click(await screen.findByRole('button', { name: 'Open report' }));
    expect(await screen.findByRole('heading', { name: 'Report 7 in org-1' })).toBeInTheDocument();
  });

  it('switches organization through the shell', async () => {
    renderApp(reportsApp, { session: twoOrgs, path: '/orgs/org-1' });
    const trigger = await screen.findByRole('button', { name: 'Switch organization' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Side' }));
    expect(await screen.findByText('org org-2, role admin')).toBeInTheDocument();
  });

  it('shows another organization as not found', async () => {
    renderApp(reportsApp, { session: twoOrgs, path: '/orgs/org-9' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Not found');
    expect(screen.queryByRole('banner')).toBeNull();
  });

  it('shows no access to a member without a role in the application, inside the shell', async () => {
    const session = devSession(reportsApp, {
      organizations: [
        { id: 'org-1', name: 'Acme' },
        { id: 'org-3', name: 'Elsewhere' },
      ],
    });
    session.user!.memberships![1].applications = {};
    renderApp(reportsApp, { session, path: '/orgs/org-3' });
    expect(await screen.findByRole('alert')).toHaveTextContent('No access');
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('shows a page the application does not have as not found', async () => {
    renderApp(reportsApp, { session: twoOrgs, path: '/orgs/org-1/nope' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Not found');
  });

  it('explains when the person holds the application nowhere', async () => {
    const session = devSession(reportsApp);
    session.user!.memberships![0].applications = {};
    renderApp(reportsApp, { session });
    expect(await screen.findByRole('alert')).toHaveTextContent('No organization with Reports');
  });

  it('sends a signed-out visitor to sign in', async () => {
    const navigate = vi.fn();
    const client = new SessionClient({
      fetch: (async () =>
        new Response(JSON.stringify({ authenticated: false }), { status: 200 })) as typeof fetch,
    });
    render(
      <SessionProvider client={client} navigate={navigate} refreshInterval={0}>
        <MemoryRouter initialEntries={['/orgs/org-1']}>
          <HostRoutes app={reportsApp} />
        </MemoryRouter>
      </SessionProvider>
    );
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^\/bff\/auth\/login/))
    );
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

describe('swapping the shell', () => {
  it('runs the same application inside another stack’s shell', async () => {
    const StackShell: Shell = ({ app, context, children }) => (
      <div>
        <header>
          <strong>Stack chrome</strong> · {app.name} · {context.organizationId}
        </header>
        <main>{children}</main>
      </div>
    );
    renderApp(reportsApp, { session: twoOrgs, shell: StackShell });
    expect(await screen.findByText('Stack chrome')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reports home' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Products' })).toBeNull();
  });
});

describe('useAppContext', () => {
  it('refuses use outside a hosted application', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Home />)).toThrow(
      'useAppContext must be used inside an application hosted by createHost'
    );
    spy.mockRestore();
  });
});

describe('conformance', () => {
  it('accepts a hostable application', () => {
    expect(conformanceProblems(reportsApp)).toEqual([]);
  });

  it('names what keeps an application from being hostable', () => {
    expect(conformanceProblems({ id: ' ', name: '', routes: [] })).toEqual([
      'id is empty',
      'name is empty',
      'routes is empty',
    ]);
    expect(
      conformanceProblems({ id: 'x', name: 'X', routes: [{ path: 'a', element: null }] })
    ).toEqual(['routes has no index route for the organization home']);
  });
});

describe('devSession', () => {
  it('gives the person a role in the application and lists it in the catalog', () => {
    const s = devSession(reportsApp);
    expect(s.user?.memberships?.[0].applications).toEqual({ reports: 'admin' });
    expect(s.apps?.map((a) => a.id)).toEqual(['reports']);
  });
});

describe('serving under a path', () => {
  it('routes relative to the basename', async () => {
    window.history.pushState({}, '', '/console/orgs/org-1/reports/7');
    render(createHost({ app: reportsApp, devSession: twoOrgs, basename: '/console' }));
    expect(await screen.findByRole('heading', { name: 'Report 7 in org-1' })).toBeInTheDocument();
    window.history.pushState({}, '', '/');
  });
});
