# @plexusone/host

Host SystemForge applications. An application exports an `AppModule`, its
pages and what it adds to the chrome, and never imports a shell. A stack
hosts it with its own `Shell` through `createHost`, and the same module runs
on its own in `DevShell`.

## Installation

```bash
pnpm add @plexusone/host @plexusone/auth @plexusone/shell react-router
```

## The contracts

```ts
interface AppModule {
  id: string; // the application's ID in the app catalog and in roles
  name: string;
  routes: RouteObject[]; // its pages, relative to /orgs/:org; an index route is its home
  navigation?: (context: AppContext) => NavSection[];
  profileItems?: (context: AppContext) => UserAction[];
  command?: ReactNode;
  actions?: ReactNode;
}

interface AppContext {
  organizationId: string;
  role?: string; // the role held in this application in that organization
  navigate: (path: string) => void; // within the organization
}

type Shell = (props: ShellProps) => ReactNode; // ShellProps: app, context, onOrganizationChange, children
```

## createHost

```tsx
import { createHost } from '@plexusone/host';

createRoot(root).render(createHost({ app: reportsApp, shell: StackShell }));
```

| Option          | Meaning                                      |
| --------------- | -------------------------------------------- |
| `app`           | The application                              |
| `shell`         | The chrome around it. Default `DevShell`     |
| `sessionClient` | The BFF client, when it is not at `/bff`     |
| `devSession`    | `true`, or a session, to run with no backend |

It provides the session and the router, then:

| URL                                                | Shows                                                                 |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `/`                                                | The first organization the person holds a role in this application in |
| `/orgs/:org/...`                                   | The application's routes inside the shell                             |
| An organization the person is not a member of      | Not found                                                             |
| An organization without a role in this application | No access, inside the shell                                           |

Signed-out visitors are sent to sign in through the BFF.

## DevShell and a development session

`DevShell` is a neutral shell: the application's name as the brand, the
product and organization switchers, the theme toggle and the profile menu.
With `devSession`, an application runs with no backend:

```tsx
createRoot(root).render(createHost({ app: reportsApp, devSession: true }));
```

`devSession(app, options)` builds the session, with options for the person's
name, role, organizations and other applications in the catalog.

## Testing

```tsx
import { renderApp, conformanceProblems } from '@plexusone/host/testing';

renderApp(reportsApp, { path: '/orgs/dev-org/reports/7' });
expect(conformanceProblems(reportsApp)).toEqual([]);
```

`renderApp` renders the application as `createHost` would, in a memory router
with a fixture session. Pass `shell` to test it inside another shell.
`conformanceProblems` lists what keeps a module from being hostable.

See [Writing an application](../guides/writing-an-application.md).
