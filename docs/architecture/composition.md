# Composing applications

A SystemForge deployment usually runs more than one application: an
identity service, and the products people sign in to. The shell gives them
one chrome (a product switcher, an organization switcher and a profile
menu) in either of two ways of composing them.

|                             | One build                     | One host per application                                                  |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| Applications                | Registered into one front end | Each built and deployed on its own host                                   |
| Moving between applications | Client-side route change      | A link to the other host; a full page load                                |
| Product switcher entries    | The deployment's app catalog  | The deployment's app catalog                                              |
| Session                     | One BFF session               | One BFF session per host, one sign-in through the shared identity service |

Both read the same session from the relying-party BFF (`GET /bff/session`):
the person, their memberships keyed by organization ID with the role they
hold in each application, and the deployment's app catalog. The product
switcher shows the applications the person holds a role in for the current
organization, in the catalog's order, with the current application
highlighted in its place.

## One host per application

Each application wraps itself in `SessionProvider` and renders the
switchers. Links in the product switcher go to each application's host; the
person is already signed in through the identity service, so the other
application starts its own BFF session without a prompt.

```tsx
import { SessionProvider } from '@plexusone/auth';
import { OrganizationSwitcher, ProductSwitcher } from '@plexusone/shell';
import { useNavigate, useParams } from 'react-router-dom';

const self = { id: 'reports', name: 'Reports', url: '/' };

function TopBar() {
  const { org } = useParams(); // the organization ID is in the URL
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-4 px-4 h-14 border-b border-border">
      <ProductSwitcher self={self} organizationId={org} />
      <OrganizationSwitcher value={org} onChange={(id) => navigate(`/orgs/${id}`)} />
    </header>
  );
}

export function App() {
  return (
    <SessionProvider onUnauthorized={() => window.location.assign('/bff/auth/login')}>
      {/* routes under /orgs/:org render <TopBar /> */}
    </SessionProvider>
  );
}
```

## One build

Several applications share one front end and one session. Pass
`onNavigate` so switching products is a route change instead of a page
load. The catalog's URLs are then paths within the build.

```tsx
function TopBar({ current }: { current: { id: string; name: string; url: string } }) {
  const { org } = useParams();
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-4 px-4 h-14 border-b border-border">
      <ProductSwitcher self={current} organizationId={org} onNavigate={(url) => navigate(url)} />
      <OrganizationSwitcher value={org} onChange={(id) => navigate(`/orgs/${id}`)} />
    </header>
  );
}
```

## Rules both modes follow

- **The organization is identified by ID**, in the URL and in API paths.
  A slug is for display only.
- **The application owns the current organization.** `OrganizationSwitcher`
  reports the chosen ID and keeps no state; the application navigates.
- **Roles in the interface only hide things.** The product switcher hides
  applications the person holds no role in, but each application's API
  enforces its own permissions.
- **Sign-in is a redirect** to the BFF. No credentials pass through the
  shell.
