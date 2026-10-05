import { type ReactNode } from 'react';
import type { AppShellProps } from './types';
import { ShellProvider, useShell } from './ShellContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Inner shell component (uses context)
 */
function AppShellInner({
  children,
  appName,
  logo,
  logoCollapsed,
  navigation = [],
  userActions,
  sidebarCollapsible = true,
  showOrgSwitcher = true,
}: AppShellProps): ReactNode {
  const {
    sidebarCollapsed,
    toggleSidebar,
    sidebarVisible,
    toggleSidebarVisible,
    currentPath,
    navigate,
  } = useShell();

  // Default logo if not provided
  const defaultLogo = <div className="font-semibold text-lg text-foreground">{appName}</div>;

  const defaultLogoCollapsed = (
    <div className="font-bold text-lg text-primary">{appName.charAt(0)}</div>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Sidebar */}
      <Sidebar
        navigation={navigation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={sidebarCollapsible ? toggleSidebar : undefined}
        logo={logo || defaultLogo}
        logoCollapsed={logoCollapsed || defaultLogoCollapsed}
        onNavigate={navigate}
        currentPath={currentPath}
      />

      {/* Mobile sidebar overlay */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-[1300] md:hidden"
          onClick={toggleSidebarVisible}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar
          showOrgSwitcher={showOrgSwitcher}
          userActions={userActions}
          onToggleSidebar={toggleSidebarVisible}
          onNavigate={navigate}
        />

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

/**
 * AppShell - Main application shell with sidebar, navbar, and content area
 *
 * @example
 * ```tsx
 * <AppShell
 *   appName="My App"
 *   navigation={[
 *     {
 *       items: [
 *         { id: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
 *         { id: 'settings', label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
 *       ],
 *     },
 *   ]}
 * >
 *   <Dashboard />
 * </AppShell>
 * ```
 */
export function AppShell(props: AppShellProps): ReactNode {
  return (
    <ShellProvider
      defaultCollapsed={props.defaultCollapsed}
      onNavigate={props.onNavigate}
      onCollapseChange={props.onCollapseChange}
    >
      <AppShellInner {...props} />
    </ShellProvider>
  );
}
