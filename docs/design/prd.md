# SystemForge Web - Product Requirements Document

## Executive Summary

SystemForge Web is an open-source React framework providing a complete **web application shell** with authentication, multi-tenant organization management, and ProductGraph-ready telemetry for applications built on the SystemForge backend platform. It enables rapid development of production-ready multi-tenant SaaS applications with consistent UX patterns.

## Problem Statement

### Current Challenges

1. **Inconsistent Auth Patterns**: App1 uses secure BFF (Backend-for-Frontend) with HTTP-only cookies, while App2 stores tokens in localStorage (XSS vulnerable)
2. **Duplicated Shell Components**: Each application reimplements navigation, user menus, organization switchers, and settings pages
3. **No Observability Foundation**: Applications lack instrumentation for user journey analytics, making future ProductGraph integration difficult
4. **Design Drift**: No shared design system leads to visual inconsistency across the ecosystem
5. **No Account Linking**: Users cannot easily switch between linked accounts (like Gmail/HubSpot pattern)

### Target Applications

| Application | Domain                     | Current State                          |
| ----------- | -------------------------- | -------------------------------------- |
| App1-UI     | Learning Management System | React 19, BFF auth, TanStack Query     |
| App2-web    | Professional Credibility   | React 18, localStorage tokens, Zustand |
| App3        | Dashboard Builder          | React 18, no auth implemented          |

## Goals

### Primary Goals

1. **Open Source Web Shell**: Complete application shell with navigation, user menu, and multi-tenant support
2. **Unified Secure Authentication**: Single BFF-based auth implementation with account linking
3. **Multi-Tenant First**: Built-in organization management, role hierarchies, and SaaS admin capabilities
4. **ProductGraph-Ready Instrumentation**: Event telemetry hooks integrated throughout the shell
5. **Design System Integration**: Tokens and components defined via `design-system-spec` format

### Non-Goals

- Domain-specific components (course editors, proof pages, dashboard builders)
- Backend implementation (SystemForge backend already provides these APIs)
- Mobile applications (web-first focus)

## User Personas

### 1. Application Developer

- Builds features on App1, App2, or App3
- Needs: Ready-to-use shell, quick auth setup, typed API client
- Pain: Reimplementing navigation, settings, org switching for each app

### 2. End User (Multi-Account)

- Uses multiple organizations or linked accounts
- Needs: Quick account switching, unified settings, consistent navigation
- Pain: Logging out/in to switch contexts, inconsistent UX across apps

### 3. Organization Admin

- Manages team members and organization settings
- Needs: Member management, role assignment, org settings
- Pain: Building admin UIs from scratch for each app

### 4. SaaS Platform Admin

- Manages the entire platform (non-tenant scope)
- Needs: Cross-org visibility, platform settings, user management
- Pain: No standard admin shell for platform-level operations

### 5. Product Manager

- Analyzes user behavior across applications
- Needs: User journey data, funnel analytics, engagement metrics
- Pain: No instrumentation, siloed analytics per app

## Product Concepts

### Web Shell Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ Top Menu Bar                                                         │
│ ┌─────────────┬────────────────────────────────┬──────────────────┐ │
│ │ Logo/Brand  │  Search / Breadcrumbs          │ User Menu ▼      │ │
│ │             │                                │ [Avatar] John    │ │
│ └─────────────┴────────────────────────────────┴──────────────────┘ │
├────────────────┬────────────────────────────────────────────────────┤
│ Left Nav       │ Main Content Area                                  │
│                │                                                    │
│ ┌────────────┐ │  ┌──────────────────────────────────────────────┐ │
│ │ Org Switch │ │  │                                              │ │
│ │ [▼ Acme]   │ │  │  Page content rendered here                  │ │
│ ├────────────┤ │  │                                              │ │
│ │ Dashboard  │ │  │  (Application-specific routes)               │ │
│ │ [App Nav]  │ │  │                                              │ │
│ │ ...        │ │  │                                              │ │
│ │            │ │  │                                              │ │
│ ├────────────┤ │  │                                              │ │
│ │ Settings   │ │  │                                              │ │
│ │ Help       │ │  │                                              │ │
│ └────────────┘ │  └──────────────────────────────────────────────┘ │
└────────────────┴────────────────────────────────────────────────────┘
```

### Account Linking & Switching

Similar to Gmail/HubSpot, users can:

- Link multiple OAuth accounts (GitHub, Google, SystemAuth)
- Switch between organizations without full logout
- Switch between linked accounts in one click
- See all available contexts in a unified menu

### Role Hierarchy

```
Platform Level (SaaS Admin)
├── platform_admin     # Full platform access, cross-tenant
├── platform_support   # Read-only cross-tenant for support
│
Organization Level (Tenant Scope)
├── owner              # Full org control, billing, deletion
├── admin              # Member management, settings
├── member             # Standard access (app-specific permissions)
└── guest              # Limited access (app-specific)
```

## Requirements

### Functional Requirements

#### FR-1: Web Shell Package (`@plexusone/shell`)

| ID     | Requirement                                                      | Priority |
| ------ | ---------------------------------------------------------------- | -------- |
| FR-1.1 | Provide `<AppShell>` component with configurable layout          | P0       |
| FR-1.2 | Provide `<TopBar>` with logo, search slot, and user menu         | P0       |
| FR-1.3 | Provide `<LeftNav>` with collapsible navigation and org switcher | P0       |
| FR-1.4 | Provide `<UserMenu>` with avatar, account switching, logout      | P0       |
| FR-1.5 | Provide `<OrgSwitcher>` for multi-org users                      | P0       |
| FR-1.6 | Support responsive collapse (mobile hamburger menu)              | P1       |
| FR-1.7 | Support custom branding (logo, colors via design tokens)         | P1       |
| FR-1.8 | Emit telemetry events for navigation, org switches               | P0       |

#### FR-2: Default Pages Package (`@plexusone/pages`)

| ID     | Requirement                                                       | Priority |
| ------ | ----------------------------------------------------------------- | -------- |
| FR-2.1 | Provide default `<HomePage>` (dashboard skeleton)                 | P1       |
| FR-2.2 | Provide `<UserSettingsPage>` (profile, password, linked accounts) | P0       |
| FR-2.3 | Provide `<OrgSettingsPage>` (org profile, branding)               | P1       |
| FR-2.4 | Provide `<OrgMembersPage>` (member list, invite, roles)           | P1       |
| FR-2.5 | Provide `<LinkedAccountsPage>` for managing OAuth connections     | P1       |
| FR-2.6 | Provide `<NotFoundPage>` (404) and `<ErrorPage>` (500)            | P0       |
| FR-2.7 | Provide `<LoginPage>` with OAuth provider buttons                 | P0       |
| FR-2.8 | Provide `<PlatformAdminPage>` (for SaaS admins)                   | P2       |

#### FR-3: Authentication Package (`@plexusone/auth`)

| ID     | Requirement                                                                            | Priority |
| ------ | -------------------------------------------------------------------------------------- | -------- |
| FR-3.1 | Provide `AuthProvider` React context with BFF session management                       | P0       |
| FR-3.2 | Provide `useAuth` hook returning user, isAuthenticated, isLoading, logout, refreshUser | P0       |
| FR-3.3 | Provide `ProtectedRoute` component that redirects unauthenticated users                | P0       |
| FR-3.4 | Support session-expired event handling with automatic redirect                         | P0       |
| FR-3.5 | Support multiple OAuth providers (GitHub, Google, SystemAuth)                         | P1       |
| FR-3.6 | Provide `usePermissions` hook for role-based UI rendering                              | P1       |
| FR-3.7 | Provide `useLinkedAccounts` hook for account switching                                 | P1       |
| FR-3.8 | Provide `useCurrentOrg` hook for organization context                                  | P0       |

#### FR-4: Multi-Tenant Package (`@plexusone/tenant`)

| ID     | Requirement                                                 | Priority |
| ------ | ----------------------------------------------------------- | -------- |
| FR-4.1 | Provide `TenantProvider` for organization context           | P0       |
| FR-4.2 | Provide `useOrganization` hook for current org data         | P0       |
| FR-4.3 | Provide `useOrganizations` hook for user's org list         | P0       |
| FR-4.4 | Provide `useMembership` hook for current user's role in org | P0       |
| FR-4.5 | Provide `<RequireRole>` component for role-gated UI         | P1       |
| FR-4.6 | Support platform-level (non-tenant) admin context           | P1       |
| FR-4.7 | Emit telemetry events for org context changes               | P0       |

#### FR-5: API Client Package (`@plexusone/api-client`)

| ID     | Requirement                                                     | Priority |
| ------ | --------------------------------------------------------------- | -------- |
| FR-5.1 | Provide typed fetch wrapper with automatic credential inclusion | P0       |
| FR-5.2 | Support request/response interceptors                           | P0       |
| FR-5.3 | Automatic token refresh on 401 responses                        | P0       |
| FR-5.4 | Include organization context header automatically               | P0       |
| FR-5.5 | Integration with TanStack Query                                 | P1       |
| FR-5.6 | Request deduplication for identical concurrent requests         | P2       |

#### FR-6: Telemetry Package (`@plexusone/telemetry`)

| ID     | Requirement                                                 | Priority |
| ------ | ----------------------------------------------------------- | -------- |
| FR-6.1 | Define ProductGraph-compatible event schema                 | P0       |
| FR-6.2 | Provide `useInstrumented` hook for component-level tracking | P0       |
| FR-6.3 | Automatic page view tracking on route changes               | P1       |
| FR-6.4 | Automatic click tracking with component attribution         | P1       |
| FR-6.5 | State change tracking with before/after snapshots           | P1       |
| FR-6.6 | Pluggable event sinks (console, ProductGraph, third-party)  | P1       |
| FR-6.7 | No-op mode for development/testing                          | P0       |
| FR-6.8 | Include org_id in all events automatically                  | P0       |

#### FR-7: Design Tokens Package (`@plexusone/design-tokens`)

| ID     | Requirement                                             | Priority |
| ------ | ------------------------------------------------------- | -------- |
| FR-7.1 | Define tokens via `design-system-spec` format           | P0       |
| FR-7.2 | Provide color palette tokens (brand, semantic, neutral) | P1       |
| FR-7.3 | Provide typography scale tokens                         | P1       |
| FR-7.4 | Provide spacing scale tokens                            | P1       |
| FR-7.5 | Export as CSS variables and Tailwind preset             | P1       |
| FR-7.6 | Support dark mode variants                              | P2       |
| FR-7.7 | Generate LLM context for AI-assisted development        | P1       |

### Non-Functional Requirements

| ID    | Requirement                     | Target         |
| ----- | ------------------------------- | -------------- |
| NFR-1 | Bundle size (shell package)     | < 15KB gzipped |
| NFR-2 | Bundle size (auth package)      | < 5KB gzipped  |
| NFR-3 | Bundle size (telemetry package) | < 3KB gzipped  |
| NFR-4 | TypeScript coverage             | 100%           |
| NFR-5 | Test coverage                   | > 80%          |
| NFR-6 | React version support           | 18.x, 19.x     |
| NFR-7 | Accessibility                   | WCAG 2.1 AA    |
| NFR-8 | First contentful paint          | < 1.5s         |

## Success Metrics

| Metric                       | Current  | Target    | Timeline |
| ---------------------------- | -------- | --------- | -------- |
| Apps using shared shell      | 0        | 3         | Q3 2025  |
| Auth-related security issues | 1 (App2) | 0         | Q2 2025  |
| Instrumented user events/day | 0        | 10K+      | Q3 2025  |
| Developer onboarding time    | ~2 days  | < 4 hours | Q2 2025  |
| Shell customization time     | N/A      | < 30 min  | Q3 2025  |

## Risks and Mitigations

| Risk                     | Impact                                 | Probability | Mitigation                                             |
| ------------------------ | -------------------------------------- | ----------- | ------------------------------------------------------ |
| Over-abstraction         | Apps become coupled, hard to customize | Medium      | Composable components, slot-based customization        |
| Migration disruption     | Breaking changes during adoption       | Medium      | Incremental adoption, maintain backwards compatibility |
| ProductGraph delay       | Telemetry hooks unused                 | Low         | Hooks work standalone for basic analytics              |
| Design system complexity | Tokens hard to customize               | Medium      | Use design-system-spec for structured definitions      |

## Timeline

| Phase   | Deliverables                                 | Target     |
| ------- | -------------------------------------------- | ---------- |
| Phase 1 | Auth + Tenant packages                       | Week 1-3   |
| Phase 2 | Shell components (TopBar, LeftNav, UserMenu) | Week 3-5   |
| Phase 3 | Default pages (Settings, Members, Login)     | Week 5-7   |
| Phase 4 | API client + Telemetry packages              | Week 7-9   |
| Phase 5 | Design tokens (via design-system-spec)       | Week 9-10  |
| Phase 6 | App2 migration                               | Week 10-12 |
| Phase 7 | App1 alignment                               | Week 12-14 |
| Phase 8 | App3 integration                             | Week 14-15 |

## Appendix

### A. Design System Integration

SystemForge Web uses `design-system-spec` (DSS) format for defining design tokens:

```
systemforge-design-system/
├── meta.json              # Name, version
├── foundations/
│   ├── colors.json        # Brand, semantic, neutral palettes
│   ├── typography.json    # Font families, sizes, weights
│   └── spacing.json       # Spacing scale
├── components/
│   ├── button.json        # With LLM context
│   ├── nav-item.json
│   └── user-menu.json
└── patterns/
    └── app-shell.json     # Shell layout pattern
```

Generate outputs:

```bash
# Tailwind preset
dss generate --css ./src/tokens.css

# LLM context for AI-assisted development
dss generate --llm ./DESIGN_CONTEXT.md
```

### B. Account Linking Model

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;

  // Linked OAuth accounts
  linked_accounts: LinkedAccount[];

  // Organization memberships
  memberships: Membership[];
}

interface LinkedAccount {
  provider: 'github' | 'google' | 'systemauth';
  provider_user_id: string;
  email: string;
  connected_at: string;
}

interface Membership {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
}
```

### C. Shell Customization API

```tsx
import { AppShell, TopBar, LeftNav, UserMenu } from '@plexusone/shell';

function MyApp() {
  return (
    <AppShell
      // Branding
      logo={<MyLogo />}
      brandName="App1"
      // Navigation (app-specific)
      navItems={[
        { label: 'Dashboard', href: '/', icon: HomeIcon },
        { label: 'Courses', href: '/courses', icon: BookIcon },
        { label: 'Students', href: '/students', icon: UsersIcon },
      ]}
      // Footer navigation
      footerNavItems={[
        { label: 'Settings', href: '/settings', icon: SettingsIcon },
        { label: 'Help', href: '/help', icon: HelpIcon },
      ]}
      // Slots for customization
      topBarRight={<NotificationBell />}
      leftNavBottom={<StorageUsage />}
    >
      <Outlet /> {/* React Router outlet */}
    </AppShell>
  );
}
```

### D. BFF Auth Flow

```
┌─────────┐     ┌─────────┐     ┌────────────┐     ┌──────────┐
│ Browser │     │   BFF   │     │ SystemAuth │     │  OAuth   │
└────┬────┘     └────┬────┘     └─────┬──────┘     └────┬─────┘
     │               │               │                │
     │  Click Login  │               │                │
     ├──────────────►│               │                │
     │               │  Redirect     │                │
     │               ├──────────────►│                │
     │               │               │   OAuth Flow   │
     │               │               ├───────────────►│
     │               │               │◄───────────────┤
     │               │   Callback    │                │
     │               │◄──────────────┤                │
     │  Set Cookie   │               │                │
     │◄──────────────┤               │                │
     │               │               │                │
     │  API Request  │               │                │
     ├──────────────►│               │                │
     │  (with cookie)│  + Bearer     │                │
     │               ├──────────────►│                │
     │               │◄──────────────┤                │
     │   Response    │               │                │
     │◄──────────────┤               │                │
```

### E. Related Projects

| Project                                                               | Relationship                                   |
| --------------------------------------------------------------------- | ---------------------------------------------- |
| [SystemForge](https://github.com/plexusone/systemforge)                     | Backend platform (identity, auth, marketplace) |
| [ProductGraph](https://github.com/plexusone/productgraph)             | Telemetry sink, journey analytics              |
| [design-system-spec](https://github.com/plexusone/design-system-spec) | Design token format specification              |
| [App1](https://github.com/grokify/app1)                               | Target application (LMS)                       |
| [App2](https://github.com/app2/app2-web)                              | Target application (credentials)               |
| [App3](https://github.com/plexusone/app3)                             | Target application (dashboards)                |
