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
role in for the current organization, from the session's app catalog, with
the current application first. `OrganizationSwitcher` is controlled: it
reports the chosen organization's ID and the application navigates. Both
read the session from `SessionProvider` in `@plexusone/auth`. See
[Composing applications](../architecture/composition.md).

```tsx
<ProductSwitcher self={{ id: 'reports', name: 'Reports', url: '/' }} organizationId={org} />
<OrganizationSwitcher value={org} onChange={(id) => navigate(`/orgs/${id}`)} />
```

`OrgSwitcher` remains for applications that keep the current organization
in `TenantProvider`.

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
