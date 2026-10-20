# @plexusone/shell

Application shell components for consistent layouts.

## Installation

```bash
pnpm add @plexusone/shell react-router-dom
```

## Features

- Responsive application layout
- Configurable sidebar navigation
- Top navbar with user menu
- Organization switcher
- Breadcrumbs
- Mobile-friendly

## Usage

### AppShell

The main layout component:

```tsx
import { AppShell } from '@plexusone/shell';

function App() {
  return (
    <AppShell
      brandName="My App"
      brandLogo="/logo.svg"
      navigation={[
        { label: 'Dashboard', href: '/', icon: HomeIcon },
        { label: 'Projects', href: '/projects', icon: FolderIcon },
        { label: 'Settings', href: '/settings', icon: SettingsIcon },
      ]}
    >
      <YourContent />
    </AppShell>
  );
}
```

### Nested Navigation

```tsx
const navigation = [
  { label: 'Dashboard', href: '/' },
  {
    label: 'Projects',
    href: '/projects',
    children: [
      { label: 'All Projects', href: '/projects' },
      { label: 'Archived', href: '/projects/archived' },
    ],
  },
  { label: 'Settings', href: '/settings' },
];
```

### Custom User Menu

```tsx
import { AppShell, UserMenu } from '@plexusone/shell';

function App() {
  return (
    <AppShell
      userMenu={
        <UserMenu
          items={[
            { label: 'Profile', href: '/profile' },
            { label: 'Settings', href: '/settings' },
            { type: 'divider' },
            { label: 'Logout', onClick: handleLogout },
          ]}
        />
      }
    >
      <YourContent />
    </AppShell>
  );
}
```

### Breadcrumbs

```tsx
import { Breadcrumbs } from '@plexusone/shell';

function ProjectPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'My Project' }]} />
      <h1>My Project</h1>
    </div>
  );
}
```

### Product and organization switchers

`ProductSwitcher` lists the deployment's applications the person holds a
role in for the current organization, from the session's app catalog, in
the catalog's `order`. The current application is highlighted in its place,
so the switcher looks the same in every application of a suite; an
application the catalog does not list comes first. `OrganizationSwitcher` is controlled: it
reports the chosen organization's ID and the application navigates. Both
read the session from `SessionProvider` in `@plexusone/auth`. See
[Composing applications](../architecture/composition.md).

```tsx
<ProductSwitcher self={{ id: 'reports', name: 'Reports', url: '/' }} organizationId={org} />
<OrganizationSwitcher value={org} onChange={(id) => navigate(`/orgs/${id}`)} />
```

`OrgSwitcher` remains for applications that keep the current organization
in `TenantProvider`.

#### Carrying the sidebar and theme between applications

Each application of a suite runs on its own host, so its stored sidebar state
and theme are its own. A product switcher link to another application carries
both as a URL fragment (`#sf-sidebar=collapsed&sf-theme=dark`), set when the
link is followed so it reflects the sidebar as it is then. The application it
opens adopts them before its first render, stores them, and removes the
fragment from the address bar. A fragment never reaches a server. An
application that navigates with `onNavigate` stays in one build and shares its
storage, so nothing is carried.

An application that builds its own links to another application, such as a
settings entry, wraps the URL with `carryPreferences`:

```tsx
import { carryPreferences } from '@plexusone/shell';

window.location.assign(carryPreferences('https://agents.example.com/settings'));
```

`carryPreferences(url, prefs?)` leaves a URL that already has a fragment alone,
and reads any preference not passed from storage. `adoptCarriedPreferences()`
is called for you by `ShellProvider`, so by `AppShell`, and by
`applyStoredTheme()`; call it yourself only in a shell that does neither.

### Profile menu

Under `SessionProvider`, the bar shows `ProfileMenu`: who is signed in, the
current organization, the role held in this application (falling back to
the organization role), the application's `profileItems`, and sign out. It
has no default links. Applications on `AuthProvider` keep `UserMenu`, whose
default links were removed for the same reason.

```tsx
<AppShell
  appName="Reports"
  app={{ id: 'reports', name: 'Reports', url: '/' }}
  organizationId={org}
  onOrganizationChange={(id) => navigate(`/orgs/${id}`)}
  profileItems={[{ id: 'keys', label: 'API keys', href: `/orgs/${org}/keys` }]}
>
  {children}
</AppShell>
```

### Theme

`showThemeToggle` adds a toggle that cycles light, dark and the system's
preference. The choice is stored in local storage and applied as the `dark`
class on the root element, which the design system's styles key on; while
on system it follows the operating system's preference as it changes. If
storage is unavailable the choice lasts for the page.

Call `applyStoredTheme()` before the first render so the page does not
flash the other theme:

```tsx
import { applyStoredTheme } from '@plexusone/shell';

applyStoredTheme();
createRoot(document.getElementById('root')!).render(<App />);
```

`useTheme()` returns the choice and a setter for an application that
renders its own control.

## API Reference

### AppShell Props

| Prop                   | Type                           | Description                                                                          |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| `appName`              | `string`                       | Application name, used for the default sidebar logo                                  |
| `logo`                 | `ReactNode`                    | Sidebar logo                                                                         |
| `logoCollapsed`        | `ReactNode`                    | Sidebar logo when collapsed                                                          |
| `navigation`           | `NavSection[]`                 | Sidebar navigation                                                                   |
| `breadcrumbs`          | `BreadcrumbItem[]`             | Breadcrumbs for the current page                                                     |
| `brand`                | `ReactNode`                    | Slot at the start of the bar: logo and wordmark                                      |
| `app`                  | `CatalogApp`                   | This application; shows the product switcher from the session's catalog              |
| `organizationId`       | `string`                       | The current organization's ID                                                        |
| `onOrganizationChange` | `(id: string) => void`         | Shows the controlled `OrganizationSwitcher` and reports the chosen ID                |
| `onNavigateApp`        | `(url: string) => void`        | Client-side navigation between applications in one build                             |
| `command`              | `ReactNode`                    | Slot after the switchers: search or a command bar                                    |
| `actions`              | `ReactNode`                    | Slot before the profile menu: the application's own actions                          |
| `profileItems`         | `UserAction[]`                 | The application's entries in the profile menu, above sign-out                        |
| `showThemeToggle`      | `boolean`                      | Show the light, dark and system theme toggle. Default false                          |
| `userActions`          | `UserAction[]`                 | Profile menu entries                                                                 |
| `showOrgSwitcher`      | `boolean`                      | Show the `TenantProvider`-based `OrgSwitcher` when `onOrganizationChange` is not set |
| `sidebarCollapsible`   | `boolean`                      | Whether the sidebar can collapse                                                     |
| `defaultCollapsed`     | `boolean`                      | Initial collapsed state                                                              |
| `onNavigate`           | `(href: string) => void`       | Navigation within the application, for SPA routing                                   |
| `onCollapseChange`     | `(collapsed: boolean) => void` | Called when the sidebar collapses or expands                                         |

The bar, from start to end: brand, product switcher, organization switcher,
command, breadcrumbs, actions, profile menu.

### NavItem Type

```typescript
interface NavItem {
  label: string;
  href: string;
  icon?: ComponentType;
  children?: NavItem[];
  badge?: string | number;
}
```

### Sidebar Props

| Prop         | Type                           | Description       |
| ------------ | ------------------------------ | ----------------- |
| `items`      | `NavItem[]`                    | Navigation items  |
| `collapsed`  | `boolean`                      | Collapsed state   |
| `onCollapse` | `(collapsed: boolean) => void` | Collapse callback |

### Navbar Props

| Prop          | Type        | Description           |
| ------------- | ----------- | --------------------- |
| `brandName`   | `string`    | Application name      |
| `brandLogo`   | `string`    | Logo URL              |
| `userMenu`    | `ReactNode` | User menu component   |
| `orgSwitcher` | `ReactNode` | Organization switcher |
