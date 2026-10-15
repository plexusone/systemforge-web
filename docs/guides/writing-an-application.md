# Writing an application

An application on SystemForge exports its pages once and runs anywhere: on
its own while you build it, and inside any stack's chrome when a stack hosts
it. This guide uses a reports application as the example.

## 1. Export an AppModule

The module is the application's whole contribution: pages, navigation and
what it adds to the top bar. It depends on `@plexusone/*` and React, never on
a stack.

```tsx
import type { AppModule } from '@plexusone/host';

export const reportsApp: AppModule = {
  id: 'reports', // its ID in the app catalog and in membership roles
  name: 'Reports',
  routes: [
    { index: true, element: <ReportList /> },
    { path: 'reports/:id', element: <Report /> },
  ],
  navigation: ({ organizationId }) => [
    { items: [{ id: 'all', label: 'All reports', href: `/orgs/${organizationId}` }] },
  ],
};
```

Pages read where they run from `useAppContext()`:

```tsx
function ReportList() {
  const { organizationId, role, navigate } = useAppContext();
  const canEdit = role === 'editor' || role === 'admin'; // the API still decides
  // fetch /api/v1/organizations/{organizationId}/reports ...
  return <button onClick={() => navigate('reports/7')}>Open</button>;
}
```

## 2. Run it on its own

The application's own front end, for development, uses `DevShell`:

```tsx
// main.tsx in the application's repository
createRoot(document.getElementById('root')!).render(
  createHost({ app: reportsApp, devSession: import.meta.env.VITE_DEV_SESSION === '1' })
);
```

With `devSession` it needs no backend. Without it, point the dev server's
`/bff` and `/api` proxy at the application's server, and you sign in for real.

## 3. Test it

```tsx
import { renderApp } from '@plexusone/host/testing';

it('opens a report', async () => {
  renderApp(reportsApp, { path: '/orgs/dev-org' });
  fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
  expect(await screen.findByRole('heading', { name: /Report 7/ })).toBeInTheDocument();
});
```

## 4. Host it in a stack

A stack writes one `Shell` with its brand and hosts each application with it,
one front end per application, served on the application's host:

```tsx
const StackShell: Shell = ({ app, context, onOrganizationChange, children }) => (
  <AppShell
    appName={app.name}
    brand={<StackLogo />}
    app={{ id: app.id, name: app.name, url: '/' }}
    organizationId={context.organizationId}
    onOrganizationChange={onOrganizationChange}
    navigation={app.navigation?.(context)}
    showThemeToggle
  >
    {children}
  </AppShell>
);

createRoot(root).render(createHost({ app: reportsApp, shell: StackShell }));
```

The application does not change: swapping the shell changes only the chrome.
See [Composing applications](../architecture/composition.md) for one front
end per application versus several in one build.
