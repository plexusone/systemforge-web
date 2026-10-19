# @plexusone/console

The organization console's pages: an organization's connections to external
services, a gallery of services to connect, and a step-by-step wizard for
each, driven by the service's manifest. SystemAuth serves the console under
`/console` on its own host and signs it in with its login session; see
SystemForge's [organization console guide](https://plexusone.github.io/systemforge/guides/console/)
and ADR-018.

```bash
pnpm add @plexusone/console @plexusone/host @plexusone/auth @plexusone/ui react-router
```

## Build the console

The console is an `AppModule`, so it runs in `createHost` inside any shell.
Build it with the stack's chrome and `/console/` as Vite's `base`, and point
SystemAuth's `console.web_dir` at the output:

```tsx
import { createRoot } from 'react-dom/client';
import { createHost } from '@plexusone/host';
import { CONSOLE_BASENAME, consoleApp, consoleSessionClient } from '@plexusone/console';

createRoot(document.getElementById('root')!).render(
  createHost({
    app: consoleApp,
    shell: StackShell,
    sessionClient: consoleSessionClient(), // SystemAuth's /console/bff
    basename: CONSOLE_BASENAME, // '/console'
  })
);
```

The pages use Tailwind classes from `@plexusone/ui`'s preset; add the
package's `dist` to the stack's Tailwind sources.

## Pages

Routes are relative to `/orgs/{id}/`:

| Route                        | Page                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `connections`                | The organization's connections: service, account, rotation, expiry, and Test, Replace token, Rename, Disconnect. The organization home opens it |
| `connections/new`            | A card for each service the deployment offers, with how many are connected                                                                      |
| `connections/new/{provider}` | The wizard: choose how the token is rotated, create it at the service by the manifest's steps, grant the listed permissions, paste it           |

Everyone in the organization sees its connections and may test them; owners
and admins connect, replace, rename and disconnect, as SystemAuth enforces.

**The wizard follows the manifest.** A method's `rotation` modes become the
first step, recommended first, each with the permissions it adds and the
trade-off it carries. Its `setup` steps for the chosen mode become numbered
instructions, with a button that opens each step's link at the service in a
new tab. Its `scopes`, with the chosen mode's, become the permissions table,
and its `fields` the form. A token the service rejects is explained and not
saved. A service without guidance gets the form and its help link.

**Expiry.** When the service reports when a token expires, the list shows it
and flags the last two weeks, so it can be replaced in time.

## Next steps

The console does not know the products. A host that does can point each
connection at what uses it, shown after connecting and on each usable
connection:

```tsx
const app = createConsoleApp({
  nextSteps: (connection, { organizationId, apps }) => {
    const portfolio = apps.find((a) => a.id === 'portfolio');
    return connection.provider === 'cloudflare' && portfolio
      ? [
          {
            label: 'Add sites in Portfolio',
            href: `${portfolio.url}/orgs/${organizationId}/sites/new?connection_id=${connection.id}`,
          },
        ]
      : [];
  },
});
```

`apps` is the app catalog from the session. `consoleApp` is
`createConsoleApp()`, without next steps.

## Linking from an application

An application sends people to the wizard and gets them back:

```text
/console/orgs/{org}/connections/new/cloudflare?return_to=https://app.example.com/sites/new
```

After connecting, **Continue** checks `return_to` with SystemAuth, which
allows paths on its host and its allowed redirect origins, and goes there.

## API

`api` calls the console's API under `/console/api` as the signed-in person:
`providers`, `connections`, `create`, `rename`, `test`, `reconnect`,
`disconnect` and `returnTo`. Failures are `ApiError`s with the HTTP status.
