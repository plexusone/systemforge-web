# SystemForge Web - Technical Requirements Document

## Overview

This document specifies the technical architecture, interfaces, and implementation details for SystemForge Web, an open-source React framework providing a complete web application shell for multi-tenant SaaS applications.

## Architecture

### Package Structure

```
systemforge-web/
├── packages/
│   ├── shell/                   # Application shell components
│   │   ├── src/
│   │   │   ├── AppShell.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── LeftNav.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── OrgSwitcher.tsx
│   │   │   ├── NavItem.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useShellState.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── pages/                   # Default page components
│   │   ├── src/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── UserSettingsPage.tsx
│   │   │   ├── LinkedAccountsPage.tsx
│   │   │   ├── OrgSettingsPage.tsx
│   │   │   ├── OrgMembersPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── ErrorPage.tsx
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                    # Authentication primitives
│   │   ├── src/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermissions.ts
│   │   │   ├── useLinkedAccounts.ts
│   │   │   ├── bff-client.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── tenant/                  # Multi-tenant primitives
│   │   ├── src/
│   │   │   ├── TenantProvider.tsx
│   │   │   ├── useOrganization.ts
│   │   │   ├── useOrganizations.ts
│   │   │   ├── useMembership.ts
│   │   │   ├── RequireRole.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/              # HTTP client utilities
│   │   ├── src/
│   │   │   ├── createClient.ts
│   │   │   ├── middleware.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── telemetry/               # Event instrumentation
│   │   ├── src/
│   │   │   ├── TelemetryProvider.tsx
│   │   │   ├── EventEmitter.ts
│   │   │   ├── useInstrumented.ts
│   │   │   ├── usePageView.ts
│   │   │   ├── withTelemetry.tsx
│   │   │   ├── sinks/
│   │   │   │   ├── console.ts
│   │   │   │   ├── productgraph.ts
│   │   │   │   └── noop.ts
│   │   │   ├── schema.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── design-tokens/           # Design system primitives
│       ├── src/
│       │   ├── colors.ts
│       │   ├── typography.ts
│       │   ├── spacing.ts
│       │   ├── tailwind-preset.ts
│       │   └── index.ts
│       ├── dss/                 # design-system-spec files
│       │   ├── meta.json
│       │   ├── foundations/
│       │   │   ├── colors.json
│       │   │   ├── typography.json
│       │   │   └── spacing.json
│       │   └── components/
│       │       ├── button.json
│       │       ├── nav-item.json
│       │       └── user-menu.json
│       ├── tokens.css
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── docs/                    # Documentation site (MkDocs)
│   └── example/                 # Example application
│
├── turbo.json                   # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

### Monorepo Tooling

- **Package Manager**: pnpm (workspace support, fast installs)
- **Build System**: Turborepo (parallel builds, caching)
- **Bundler**: tsup (fast TypeScript bundling, tree-shaking)
- **Testing**: Vitest (fast, ESM-native)
- **Linting**: ESLint + Prettier

## Package Specifications

### 1. @plexusone/shell

#### Dependencies

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "react-router-dom": "^6.0.0 || ^7.0.0",
    "@plexusone/auth": "workspace:*",
    "@plexusone/tenant": "workspace:*",
    "@plexusone/telemetry": "workspace:*"
  },
  "dependencies": {
    "lucide-react": "^0.400.0"
  }
}
```

#### Exported Types

```typescript
// types.ts

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation target */
  href: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Badge count (notifications, etc.) */
  badge?: number;
  /** Required role to see this item */
  requiredRole?: string;
  /** Child items for nested navigation */
  children?: NavItem[];
}

export interface AppShellProps {
  children: React.ReactNode;

  // Branding
  /** Logo component or image */
  logo?: React.ReactNode;
  /** Brand name shown next to logo */
  brandName?: string;
  /** Home URL when clicking logo */
  homeUrl?: string;

  // Navigation
  /** Primary navigation items */
  navItems: NavItem[];
  /** Footer navigation items (Settings, Help, etc.) */
  footerNavItems?: NavItem[];

  // Customization slots
  /** Content for right side of top bar */
  topBarRight?: React.ReactNode;
  /** Content for bottom of left nav */
  leftNavBottom?: React.ReactNode;
  /** Content above navigation items */
  leftNavTop?: React.ReactNode;

  // Behavior
  /** Initial collapsed state of left nav */
  defaultCollapsed?: boolean;
  /** Hide org switcher (single-org apps) */
  hideOrgSwitcher?: boolean;
  /** Custom user menu component */
  userMenu?: React.ReactNode;
}

export interface TopBarProps {
  logo?: React.ReactNode;
  brandName?: string;
  homeUrl?: string;
  rightContent?: React.ReactNode;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export interface LeftNavProps {
  navItems: NavItem[];
  footerNavItems?: NavItem[];
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  hideOrgSwitcher?: boolean;
}

export interface UserMenuProps {
  /** Custom menu items */
  additionalItems?: NavItem[];
  /** Hide linked accounts section */
  hideLinkedAccounts?: boolean;
  /** Hide settings link */
  hideSettings?: boolean;
}

export interface OrgSwitcherProps {
  /** Callback when org changes */
  onOrgChange?: (orgId: string) => void;
  /** Show create org option */
  showCreateOrg?: boolean;
}
```

#### Core Implementation

```typescript
// AppShell.tsx

import { useState, useCallback } from 'react';
import { TopBar } from './TopBar';
import { LeftNav } from './LeftNav';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';
import { useInstrumented } from '@plexusone/telemetry';
import type { AppShellProps } from './types';

export function AppShell({
  children,
  logo,
  brandName,
  homeUrl = '/',
  navItems,
  footerNavItems,
  topBarRight,
  leftNavBottom,
  leftNavTop,
  defaultCollapsed = false,
  hideOrgSwitcher = false,
  userMenu,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { trackClick } = useInstrumented({
    component: 'AppShell',
  });

  const handleNavToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
    trackClick('toggle_nav', 'collapse_button');
  }, [trackClick]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
    trackClick('toggle_mobile_menu', 'hamburger');
  }, [trackClick]);

  return (
    <div className="cf-shell">
      <TopBar
        logo={logo}
        brandName={brandName}
        homeUrl={homeUrl}
        rightContent={
          <>
            {topBarRight}
            {userMenu ?? <UserMenu />}
          </>
        }
        onMenuToggle={handleMobileMenuToggle}
        showMenuButton
      />

      <div className="cf-shell-body">
        <LeftNav
          navItems={navItems}
          footerNavItems={footerNavItems}
          topContent={leftNavTop}
          bottomContent={leftNavBottom}
          collapsed={collapsed}
          onCollapsedChange={handleNavToggle}
          hideOrgSwitcher={hideOrgSwitcher}
        />

        <main className="cf-shell-content">
          {children}
        </main>
      </div>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        footerNavItems={footerNavItems}
        hideOrgSwitcher={hideOrgSwitcher}
      />
    </div>
  );
}
```

```typescript
// UserMenu.tsx

import { useState } from 'react';
import { useAuth, useLinkedAccounts } from '@plexusone/auth';
import { useOrganizations, useCurrentOrg } from '@plexusone/tenant';
import { useInstrumented } from '@plexusone/telemetry';
import type { UserMenuProps } from './types';

export function UserMenu({
  additionalItems,
  hideLinkedAccounts = false,
  hideSettings = false,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { linkedAccounts, switchAccount } = useLinkedAccounts();
  const { organizations } = useOrganizations();
  const { currentOrg, setCurrentOrg } = useCurrentOrg();

  const { trackClick } = useInstrumented({ component: 'UserMenu' });

  if (!user) return null;

  const handleLogout = async () => {
    trackClick('logout', 'logout_button');
    await logout();
  };

  const handleSwitchAccount = (accountId: string) => {
    trackClick('switch_account', 'account_item', { target_account: accountId });
    switchAccount(accountId);
    setOpen(false);
  };

  const handleSwitchOrg = (orgId: string) => {
    trackClick('switch_org', 'org_item', { target_org: orgId });
    setCurrentOrg(orgId);
    setOpen(false);
  };

  return (
    <div className="cf-user-menu">
      <button
        className="cf-user-menu-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <img
          src={user.avatar_url || '/default-avatar.png'}
          alt={user.name || user.email}
          className="cf-avatar"
        />
        <span className="cf-user-name">{user.name || user.email}</span>
      </button>

      {open && (
        <div className="cf-user-menu-dropdown" role="menu">
          {/* Current user info */}
          <div className="cf-user-menu-header">
            <img src={user.avatar_url} alt="" className="cf-avatar-lg" />
            <div>
              <div className="cf-user-menu-name">{user.name}</div>
              <div className="cf-user-menu-email">{user.email}</div>
            </div>
          </div>

          {/* Organization switcher */}
          {organizations.length > 1 && (
            <div className="cf-user-menu-section">
              <div className="cf-user-menu-section-title">Organizations</div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  className="cf-user-menu-item"
                  onClick={() => handleSwitchOrg(org.id)}
                  aria-current={org.id === currentOrg?.id ? 'true' : undefined}
                >
                  {org.name}
                  {org.id === currentOrg?.id && <CheckIcon />}
                </button>
              ))}
            </div>
          )}

          {/* Linked accounts */}
          {!hideLinkedAccounts && linkedAccounts.length > 0 && (
            <div className="cf-user-menu-section">
              <div className="cf-user-menu-section-title">Switch Account</div>
              {linkedAccounts.map((account) => (
                <button
                  key={account.id}
                  className="cf-user-menu-item"
                  onClick={() => handleSwitchAccount(account.id)}
                >
                  <ProviderIcon provider={account.provider} />
                  {account.email}
                </button>
              ))}
            </div>
          )}

          {/* Additional items */}
          {additionalItems?.map((item) => (
            <a key={item.id} href={item.href} className="cf-user-menu-item">
              {item.icon && <item.icon className="cf-icon" />}
              {item.label}
            </a>
          ))}

          {/* Settings */}
          {!hideSettings && (
            <a href="/settings" className="cf-user-menu-item">
              <SettingsIcon className="cf-icon" />
              Settings
            </a>
          )}

          {/* Logout */}
          <button className="cf-user-menu-item cf-danger" onClick={handleLogout}>
            <LogOutIcon className="cf-icon" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
```

```typescript
// OrgSwitcher.tsx

import { useState } from 'react';
import { useOrganizations, useCurrentOrg } from '@plexusone/tenant';
import { useInstrumented } from '@plexusone/telemetry';
import type { OrgSwitcherProps } from './types';

export function OrgSwitcher({ onOrgChange, showCreateOrg = true }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { organizations, isLoading } = useOrganizations();
  const { currentOrg, setCurrentOrg } = useCurrentOrg();

  const { trackClick } = useInstrumented({ component: 'OrgSwitcher' });

  const handleOrgSelect = (orgId: string) => {
    trackClick('select_org', 'org_option', { org_id: orgId });
    setCurrentOrg(orgId);
    onOrgChange?.(orgId);
    setOpen(false);
  };

  if (isLoading || organizations.length === 0) {
    return null;
  }

  return (
    <div className="cf-org-switcher">
      <button
        className="cf-org-switcher-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="cf-org-avatar">
          {currentOrg?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="cf-org-name">{currentOrg?.name || 'Select org'}</span>
        <ChevronDownIcon className="cf-icon-sm" />
      </button>

      {open && (
        <div className="cf-org-switcher-dropdown">
          {organizations.map((org) => (
            <button
              key={org.id}
              className="cf-org-switcher-item"
              onClick={() => handleOrgSelect(org.id)}
              aria-current={org.id === currentOrg?.id ? 'true' : undefined}
            >
              <div className="cf-org-avatar-sm">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div className="cf-org-info">
                <div className="cf-org-item-name">{org.name}</div>
                <div className="cf-org-item-role">{org.role}</div>
              </div>
              {org.id === currentOrg?.id && <CheckIcon />}
            </button>
          ))}

          {showCreateOrg && (
            <>
              <hr className="cf-divider" />
              <a href="/organizations/new" className="cf-org-switcher-item">
                <PlusIcon className="cf-icon" />
                Create organization
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. @plexusone/pages

```typescript
// UserSettingsPage.tsx

import { useState } from 'react';
import { useAuth, useLinkedAccounts } from '@plexusone/auth';
import { useInstrumented } from '@plexusone/telemetry';

export function UserSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { linkedAccounts, linkAccount, unlinkAccount } = useLinkedAccounts();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'accounts'>('profile');

  const { trackClick } = useInstrumented({ component: 'UserSettingsPage' });

  return (
    <div className="cf-settings-page">
      <h1 className="cf-page-title">Settings</h1>

      <div className="cf-tabs">
        <button
          className={`cf-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('profile');
            trackClick('tab_change', 'profile_tab');
          }}
        >
          Profile
        </button>
        <button
          className={`cf-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('security');
            trackClick('tab_change', 'security_tab');
          }}
        >
          Security
        </button>
        <button
          className={`cf-tab ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('accounts');
            trackClick('tab_change', 'accounts_tab');
          }}
        >
          Linked Accounts
        </button>
      </div>

      {activeTab === 'profile' && (
        <ProfileSettingsSection user={user} onSave={refreshUser} />
      )}

      {activeTab === 'security' && (
        <SecuritySettingsSection />
      )}

      {activeTab === 'accounts' && (
        <LinkedAccountsSection
          accounts={linkedAccounts}
          onLink={linkAccount}
          onUnlink={unlinkAccount}
        />
      )}
    </div>
  );
}
```

```typescript
// OrgMembersPage.tsx

import { useState } from 'react';
import { useOrganization, useMembership, useOrgMembers } from '@plexusone/tenant';
import { RequireRole } from '@plexusone/tenant';
import { useInstrumented } from '@plexusone/telemetry';

export function OrgMembersPage() {
  const { organization } = useOrganization();
  const { membership } = useMembership();
  const { members, invite, updateRole, remove, isLoading } = useOrgMembers();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { trackClick } = useInstrumented({ component: 'OrgMembersPage' });

  const canManageMembers = ['owner', 'admin'].includes(membership?.role || '');

  return (
    <div className="cf-members-page">
      <div className="cf-page-header">
        <h1 className="cf-page-title">Team Members</h1>

        <RequireRole roles={['owner', 'admin']}>
          <button
            className="cf-button cf-button-primary"
            onClick={() => {
              setShowInviteModal(true);
              trackClick('open_invite_modal', 'invite_button');
            }}
          >
            Invite Member
          </button>
        </RequireRole>
      </div>

      <div className="cf-members-list">
        {members.map((member) => (
          <div key={member.id} className="cf-member-row">
            <img src={member.avatar_url} alt="" className="cf-avatar" />
            <div className="cf-member-info">
              <div className="cf-member-name">{member.name}</div>
              <div className="cf-member-email">{member.email}</div>
            </div>
            <div className="cf-member-role">
              {canManageMembers && member.id !== membership?.user_id ? (
                <select
                  value={member.role}
                  onChange={(e) => {
                    updateRole(member.id, e.target.value);
                    trackClick('change_role', 'role_select', {
                      member_id: member.id,
                      new_role: e.target.value,
                    });
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              ) : (
                <span className="cf-role-badge">{member.role}</span>
              )}
            </div>
            {canManageMembers && member.id !== membership?.user_id && (
              <button
                className="cf-button cf-button-ghost cf-danger"
                onClick={() => {
                  remove(member.id);
                  trackClick('remove_member', 'remove_button', {
                    member_id: member.id,
                  });
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={invite}
        />
      )}
    </div>
  );
}
```

### 3. @plexusone/tenant

```typescript
// TenantProvider.tsx

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@plexusone/auth';
import { getEmitter } from '@plexusone/telemetry';
import type { Organization, Membership, TenantContextValue } from './types';

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export interface TenantProviderProps {
  children: ReactNode;
  /** Initial organization ID (from URL or localStorage) */
  initialOrgId?: string;
  /** Storage key for persisting selected org */
  storageKey?: string;
}

export function TenantProvider({
  children,
  initialOrgId,
  storageKey = 'systemforge:current_org',
}: TenantProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(() => {
    return initialOrgId || localStorage.getItem(storageKey);
  });
  const [isLoading, setIsLoading] = useState(true);

  // Derive organizations from user memberships
  const organizations: Organization[] = user?.memberships.map((m) => ({
    id: m.organization_id,
    name: m.organization_name,
    slug: m.organization_slug,
    role: m.role,
  })) ?? [];

  // Find current organization
  const currentOrg = organizations.find((o) => o.id === currentOrgId) ?? organizations[0] ?? null;

  // Find current membership
  const currentMembership = user?.memberships.find(
    (m) => m.organization_id === currentOrgId
  ) ?? null;

  // Auto-select first org if none selected
  useEffect(() => {
    if (isAuthenticated && !currentOrgId && organizations.length > 0) {
      setCurrentOrgId(organizations[0].id);
    }
    setIsLoading(false);
  }, [isAuthenticated, currentOrgId, organizations]);

  // Persist org selection
  useEffect(() => {
    if (currentOrgId) {
      localStorage.setItem(storageKey, currentOrgId);
    }
  }, [currentOrgId, storageKey]);

  const setCurrentOrg = useCallback((orgId: string) => {
    const emitter = getEmitter();
    emitter?.emit('custom', {
      action: 'org_switch',
      metadata: {
        from_org_id: currentOrgId,
        to_org_id: orgId,
      },
    });
    setCurrentOrgId(orgId);
  }, [currentOrgId]);

  // Check if user is platform admin (non-tenant scope)
  const isPlatformAdmin = user?.memberships.some(
    (m) => m.role === 'platform_admin'
  ) ?? false;

  return (
    <TenantContext.Provider
      value={{
        organizations,
        currentOrg,
        currentMembership,
        setCurrentOrg,
        isLoading,
        isPlatformAdmin,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useOrganization must be used within TenantProvider');
  }
  return {
    organization: context.currentOrg,
    isLoading: context.isLoading,
  };
}

export function useOrganizations() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useOrganizations must be used within TenantProvider');
  }
  return {
    organizations: context.organizations,
    isLoading: context.isLoading,
  };
}

export function useMembership() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useMembership must be used within TenantProvider');
  }
  return {
    membership: context.currentMembership,
    isPlatformAdmin: context.isPlatformAdmin,
  };
}

export function useCurrentOrg() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useCurrentOrg must be used within TenantProvider');
  }
  return {
    currentOrg: context.currentOrg,
    setCurrentOrg: context.setCurrentOrg,
  };
}
```

```typescript
// RequireRole.tsx

import { ReactNode } from 'react';
import { useMembership } from './TenantProvider';

export interface RequireRoleProps {
  children: ReactNode;
  /** Roles that grant access (any match) */
  roles: string[];
  /** Fallback when user lacks required role */
  fallback?: ReactNode;
  /** Also allow platform admins */
  allowPlatformAdmin?: boolean;
}

const ROLE_HIERARCHY: Record<string, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  owner: 3,
  platform_admin: 100,
};

export function RequireRole({
  children,
  roles,
  fallback = null,
  allowPlatformAdmin = true,
}: RequireRoleProps) {
  const { membership, isPlatformAdmin } = useMembership();

  // Platform admin bypass
  if (allowPlatformAdmin && isPlatformAdmin) {
    return <>{children}</>;
  }

  // Check role membership
  const userRole = membership?.role;
  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check if user's role is in allowed list or higher in hierarchy
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const hasAccess = roles.some((role) => {
    const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
    return userLevel >= requiredLevel;
  });

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 4. @plexusone/design-tokens (with design-system-spec)

```json
// dss/meta.json
{
  "name": "SystemForge Design System",
  "version": "1.0.0",
  "description": "Design tokens for SystemForge Web applications"
}
```

```json
// dss/foundations/colors.json
{
  "brand": {
    "50": { "value": "#f0f9ff", "description": "Lightest brand" },
    "100": { "value": "#e0f2fe" },
    "200": { "value": "#bae6fd" },
    "300": { "value": "#7dd3fc" },
    "400": { "value": "#38bdf8" },
    "500": { "value": "#0ea5e9", "description": "Primary brand" },
    "600": { "value": "#0284c7" },
    "700": { "value": "#0369a1" },
    "800": { "value": "#075985" },
    "900": { "value": "#0c4a6e" },
    "950": { "value": "#082f49", "description": "Darkest brand" }
  },
  "semantic": {
    "success": {
      "light": { "value": "#dcfce7" },
      "default": { "value": "#22c55e" },
      "dark": { "value": "#166534" }
    },
    "warning": {
      "light": { "value": "#fef3c7" },
      "default": { "value": "#f59e0b" },
      "dark": { "value": "#92400e" }
    },
    "error": {
      "light": { "value": "#fee2e2" },
      "default": { "value": "#ef4444" },
      "dark": { "value": "#991b1b" }
    },
    "info": {
      "light": { "value": "#dbeafe" },
      "default": { "value": "#3b82f6" },
      "dark": { "value": "#1e40af" }
    }
  },
  "neutral": {
    "50": { "value": "#f9fafb" },
    "100": { "value": "#f3f4f6" },
    "200": { "value": "#e5e7eb" },
    "300": { "value": "#d1d5db" },
    "400": { "value": "#9ca3af" },
    "500": { "value": "#6b7280" },
    "600": { "value": "#4b5563" },
    "700": { "value": "#374151" },
    "800": { "value": "#1f2937" },
    "900": { "value": "#111827" },
    "950": { "value": "#030712" }
  }
}
```

```json
// dss/components/nav-item.json
{
  "id": "NavItem",
  "name": "Navigation Item",
  "description": "Navigation link in the shell sidebar",
  "variants": [
    { "id": "default", "isDefault": true },
    { "id": "active", "description": "Currently active page" },
    { "id": "disabled", "description": "Unavailable navigation" }
  ],
  "states": ["default", "hover", "focus", "active", "disabled"],
  "llm": {
    "intent": "Navigate to a page or section within the application",
    "allowedContexts": ["left-nav", "mobile-menu", "footer-nav"],
    "forbiddenContexts": ["inline-text", "form"],
    "antiPatterns": [
      "Using NavItem for external links (use regular anchor)",
      "Nesting NavItems more than 2 levels deep",
      "NavItem without an icon in primary navigation"
    ],
    "examples": [
      "<NavItem href=\"/dashboard\" icon={HomeIcon}>Dashboard</NavItem>",
      "<NavItem href=\"/settings\" icon={SettingsIcon}>Settings</NavItem>"
    ]
  },
  "accessibility": {
    "role": "link",
    "aria": {
      "aria-current": "page when active"
    },
    "keyboard": {
      "Enter": "Navigate to target",
      "Space": "Navigate to target"
    }
  }
}
```

```json
// dss/components/user-menu.json
{
  "id": "UserMenu",
  "name": "User Menu",
  "description": "Dropdown menu showing user info, account switching, and actions",
  "variants": [
    { "id": "default", "isDefault": true },
    { "id": "compact", "description": "Collapsed view showing only avatar" }
  ],
  "llm": {
    "intent": "Display user identity and provide account/session actions",
    "allowedContexts": ["top-bar", "mobile-menu"],
    "antiPatterns": [
      "Placing UserMenu in left navigation",
      "Multiple UserMenu components on same page",
      "Hiding logout option"
    ],
    "examples": ["<UserMenu />", "<UserMenu hideLinkedAccounts />"]
  },
  "accessibility": {
    "role": "menu",
    "aria": {
      "aria-expanded": "true when open",
      "aria-haspopup": "menu"
    },
    "keyboard": {
      "Escape": "Close menu",
      "ArrowDown": "Next item",
      "ArrowUp": "Previous item"
    }
  }
}
```

## Build Configuration

### tsup.config.ts (per package)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react-router-dom'],
});
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "generate:tokens": {
      "dependsOn": [],
      "outputs": ["packages/design-tokens/tokens.css"]
    }
  }
}
```

## CSS Architecture

### Shell CSS Variables

```css
/* packages/shell/src/shell.css */

.cf-shell {
  --cf-shell-top-bar-height: 56px;
  --cf-shell-left-nav-width: 256px;
  --cf-shell-left-nav-collapsed-width: 64px;

  display: flex;
  flex-direction: column;
  height: 100vh;
}

.cf-shell-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.cf-shell-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--cf-spacing-6);
}

/* Responsive */
@media (max-width: 768px) {
  .cf-shell-left-nav {
    display: none;
  }

  .cf-shell-mobile-menu-button {
    display: block;
  }
}
```

## Security Considerations

1. **No localStorage for tokens**: All auth uses HTTP-only cookies via BFF
2. **CSRF protection**: BFF endpoints validate CSRF tokens
3. **XSS mitigation**: No sensitive data exposed to JavaScript
4. **Session expiry**: Automatic logout on 401 responses
5. **Role validation**: Server-side enforcement, client only for UX

## Performance Targets

| Package                  | Gzipped Size | Load Time Impact |
| ------------------------ | ------------ | ---------------- |
| @plexusone/shell         | < 15KB       | < 20ms           |
| @plexusone/pages         | < 10KB       | < 15ms           |
| @plexusone/auth          | < 5KB        | < 10ms           |
| @plexusone/tenant        | < 3KB        | < 5ms            |
| @plexusone/api-client    | < 3KB        | < 5ms            |
| @plexusone/telemetry     | < 4KB        | < 5ms            |
| @plexusone/design-tokens | < 2KB        | < 5ms            |

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support (ARIA labels, roles)
- Focus management for modals and dropdowns
- Color contrast ratios meet WCAG standards
- Skip navigation link for keyboard users
