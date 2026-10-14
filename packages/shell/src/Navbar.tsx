import { type ReactNode } from 'react';
import { Button, MenuIcon } from '@plexusone/ui';
import type { NavbarProps } from './types';
import { OrgSwitcher } from './OrgSwitcher';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { ProductSwitcher } from './ProductSwitcher';
import { useSessionOptional } from '@plexusone/auth';
import { ProfileMenu } from './ProfileMenu';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Breadcrumbs } from './Breadcrumbs';

/**
 * Navbar - Top navigation bar
 *
 * From start to end: the brand, the product switcher, the organization
 * switcher, the command slot, breadcrumbs, the actions slot and the
 * profile menu. The shell owns the layout; slot content is the
 * application's.
 *
 * @example
 * ```tsx
 * <Navbar
 *   brand={<Logo />}
 *   app={{ id: 'reports', name: 'Reports', url: '/' }}
 *   organizationId={orgId}
 *   onOrganizationChange={(id) => navigate(`/orgs/${id}`)}
 *   command={<Search />}
 *   actions={<Notifications />}
 * />
 * ```
 */
export function Navbar({
  showOrgSwitcher = true,
  userActions,
  breadcrumbs,
  onToggleSidebar,
  onNavigate,
  brand,
  app,
  organizationId,
  onOrganizationChange,
  onNavigateApp,
  command,
  actions,
  profileItems,
  showThemeToggle = false,
}: NavbarProps): ReactNode {
  // An application on SessionProvider gets the session's profile menu; one
  // on AuthProvider keeps UserMenu.
  const hasSession = useSessionOptional() !== undefined;

  return (
    <header className="h-16 bg-background border-b border-border flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      )}

      {brand && (
        <div className="flex items-center gap-2 shrink-0" data-slot="brand">
          {brand}
        </div>
      )}

      {app && (
        <ProductSwitcher self={app} organizationId={organizationId} onNavigate={onNavigateApp} />
      )}

      {/* Organization switcher: controlled when the application owns the organization */}
      {onOrganizationChange ? (
        <OrganizationSwitcher value={organizationId} onChange={onOrganizationChange} />
      ) : (
        showOrgSwitcher && <OrgSwitcher onNavigate={onNavigate} />
      )}

      {command && (
        <div className="flex items-center min-w-0" data-slot="command">
          {command}
        </div>
      )}

      {/* Breadcrumbs, or a spacer that pushes the end of the bar right */}
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-1 shrink-0" data-slot="actions">
          {actions}
        </div>
      )}

      {showThemeToggle && <ThemeToggle />}

      {hasSession ? (
        <ProfileMenu
          appId={app?.id}
          organizationId={organizationId}
          items={profileItems ?? userActions}
          onNavigate={onNavigate}
        />
      ) : (
        <UserMenu actions={profileItems ?? userActions} onNavigate={onNavigate} />
      )}
    </header>
  );
}
