/**
 * @plexusone/shell
 *
 * Application shell components for SystemForge applications.
 *
 * @example
 * ```tsx
 * import { AppShell } from '@plexusone/shell';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <TenantProvider>
 *         <AppShell
 *           appName="My App"
 *           navigation={[
 *             {
 *               items: [
 *                 { id: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
 *                 { id: 'settings', label: 'Settings', href: '/settings' },
 *               ],
 *             },
 *           ]}
 *         >
 *           <Routes />
 *         </AppShell>
 *       </TenantProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Main shell
export { AppShell } from './AppShell';

// Context
export { ShellProvider, useShell, useShellOptional } from './ShellContext';

// Components
export { Sidebar } from './Sidebar';
export { Navbar } from './Navbar';
export { OrgSwitcher } from './OrgSwitcher';
export { OrganizationSwitcher } from './OrganizationSwitcher';
export type { OrganizationSwitcherProps } from './OrganizationSwitcher';
export { ProductSwitcher } from './ProductSwitcher';
export type { ProductSwitcherProps } from './ProductSwitcher';
export { switcherApps } from './switcher';
export { UserMenu } from './UserMenu';
export { ProfileMenu, initials } from './ProfileMenu';
export type { ProfileMenuProps } from './ProfileMenu';
export { Breadcrumbs } from './Breadcrumbs';

// Types
export type {
  NavItem,
  NavSection,
  BreadcrumbItem,
  UserAction,
  AppShellConfig,
  AppShellProps,
  SidebarProps,
  NavbarProps,
  OrgSwitcherProps,
  UserMenuProps,
  BreadcrumbsProps,
  ShellContextValue,
} from './types';
