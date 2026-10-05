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

## API Reference

### AppShell Props

| Prop         | Type        | Description            |
| ------------ | ----------- | ---------------------- |
| `brandName`  | `string`    | Application name       |
| `brandLogo`  | `string`    | Logo URL               |
| `navigation` | `NavItem[]` | Navigation items       |
| `userMenu`   | `ReactNode` | Custom user menu       |
| `sidebar`    | `ReactNode` | Custom sidebar content |
| `footer`     | `ReactNode` | Footer content         |

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
