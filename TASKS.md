# SystemForge Web - Task Tracker

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [-] Blocked
- [!] Needs review

---

## Phase 1: Project Setup & Core Packages

### 1.1 Repository Setup

- [x] Initialize monorepo with pnpm workspaces
  - Run `pnpm init` in root
  - Create `pnpm-workspace.yaml`
  - Create `packages/` directory structure

- [x] Configure Turborepo
  - Install turbo: `pnpm add -D turbo`
  - Create `turbo.json` with build pipeline
  - Add build scripts to root `package.json`

- [x] Set up TypeScript
  - Create `tsconfig.base.json` with shared settings
  - Create per-package `tsconfig.json` extending base

- [x] Configure ESLint + Prettier
  - Install: `pnpm add -D eslint prettier eslint-config-prettier`
  - Create `.eslintrc.cjs` and `.prettierrc`
  - Add lint scripts

- [x] Set up Vitest
  - Install: `pnpm add -D vitest @testing-library/react`
  - Create `vitest.config.ts`
  - Add test scripts

- [x] GitHub Actions CI
  - Create `.github/workflows/ci.yml`
  - Jobs: lint, typecheck, test, build
  - Run on push and PR

- [x] Changesets for versioning
  - Install: `pnpm add -D @changesets/cli` (already installed)
  - Run `pnpm changeset init`
  - Create release workflow

### 1.2 Auth Package

- [x] Create package structure

  ```
  packages/auth/
  ├── src/
  │   ├── AuthProvider.tsx
  │   ├── ProtectedRoute.tsx
  │   ├── useAuth.ts
  │   ├── usePermissions.ts
  │   ├── useLinkedAccounts.ts
  │   ├── bff-client.ts
  │   ├── types.ts
  │   └── index.ts
  ├── __tests__/
  ├── package.json
  ├── tsconfig.json
  └── tsup.config.ts
  ```

- [x] Extract AuthProvider from App1-UI
  - Source: `app1-ui/src/contexts/AuthContext.tsx`
  - Generalize BFF base URL
  - Add configuration props

- [x] Extract ProtectedRoute
  - Source: `app1-ui/src/components/ProtectedRoute.tsx`
  - Add role/org checking
  - Add fallback support

- [x] Create bff-client.ts
  - Typed fetch wrapper
  - Session/user/logout/refresh endpoints
  - Automatic credential inclusion

- [x] Add usePermissions hook
  - Check user roles
  - Check org membership
  - Helper for conditional rendering

- [x] Add useLinkedAccounts hook
  - List linked OAuth accounts
  - Switch account function
  - Link/unlink functions

- [ ] Write tests
  - AuthProvider mount/fetch
  - Session expiry handling
  - ProtectedRoute redirect
  - Permission checks

- [ ] Package documentation
  - README.md with quick start
  - API documentation
  - Migration guide from local auth

### 1.3 Tenant Package

- [x] Create package structure

  ```
  packages/tenant/
  ├── src/
  │   ├── TenantProvider.tsx
  │   ├── useOrganization.ts
  │   ├── useOrganizations.ts
  │   ├── useMembership.ts
  │   ├── useCurrentOrg.ts
  │   ├── RequireRole.tsx
  │   ├── types.ts
  │   └── index.ts
  ├── __tests__/
  ├── package.json
  └── tsconfig.json
  ```

- [x] Implement TenantProvider
  - Organization context from user memberships
  - Current org selection
  - Persist to localStorage
  - Auto-select first org

- [x] Implement useOrganization
  - Return current org data
  - Loading state

- [x] Implement useOrganizations
  - Return all user's orgs
  - Loading state

- [x] Implement useMembership
  - Return current user's role in org
  - Platform admin check

- [x] Implement RequireRole
  - Role hierarchy checking
  - Platform admin bypass
  - Fallback support

- [ ] Write tests
  - Org switching
  - Role checking
  - Platform admin access

---

## Phase 2: API Client & Telemetry

### 2.1 API Client Package

- [x] Create package structure

  ```
  packages/api-client/
  ├── src/
  │   ├── createClient.ts
  │   ├── middleware.ts
  │   ├── types.ts
  │   └── index.ts
  ├── __tests__/
  ├── package.json
  └── tsconfig.json
  ```

- [x] Implement createClient
  - Generic typed fetch wrapper
  - GET/POST/PUT/PATCH/DELETE methods
  - Query param serialization

- [x] Add interceptors
  - Request interceptor (modify config)
  - Response interceptor (transform data)
  - Error handler hook

- [x] Add org context header
  - Read from TenantProvider
  - Add X-Organization-ID header

- [x] Implement 401 handling
  - Dispatch session-expired event
  - Integrate with auth package

- [x] Add timeout support
  - AbortController integration
  - Configurable timeout per request

- [x] React Query hooks (useApiQuery, useApiMutation, useApiInfiniteQuery)

- [ ] Write tests
  - Basic requests
  - Error handling
  - Org header injection

### 2.2 Telemetry Package

- [x] Create package structure

  ```
  packages/telemetry/
  ├── src/
  │   ├── TelemetryProvider.tsx
  │   ├── EventEmitter.ts
  │   ├── useInstrumented.ts
  │   ├── usePageView.ts
  │   ├── withTelemetry.tsx
  │   ├── sinks/
  │   │   ├── noop.ts
  │   │   ├── console.ts
  │   │   └── productgraph.ts
  │   ├── schema.ts
  │   ├── types.ts
  │   └── index.ts
  ```

- [x] Define event schema
  - ProductGraphEvent interface
  - Event types enum
  - EventSink interface

- [x] Implement TelemetryProvider
  - Initialize emitter
  - User/org ID resolution
  - Configuration props

- [x] Implement TelemetryEmitter
  - Event creation with auto-populated fields
  - Include org_id automatically
  - Multiple sink support
  - Enable/disable toggle

- [x] Implement sinks
  - noop sink (silent)
  - console sink (development)
  - productgraph sink (batch, sendBeacon)

- [x] Implement useInstrumented
  - Component-level tracking
  - State change detection
  - Click/input helpers

- [x] Web Vitals tracking (useWebVitals hook)

- [ ] Write tests
  - Event emission
  - Sink delivery
  - Hook behavior

---

## Phase 3: Shell Components

### 3.1 Core Shell Components

- [x] Create package structure

  ```
  packages/shell/
  ├── src/
  │   ├── AppShell.tsx
  │   ├── Navbar.tsx (TopBar)
  │   ├── Sidebar.tsx (LeftNav)
  │   ├── NavItem.tsx
  │   ├── UserMenu.tsx
  │   ├── OrgSwitcher.tsx
  │   ├── Breadcrumbs.tsx
  │   ├── ShellContext.tsx
  │   ├── types.ts
  │   └── index.ts
  ```

- [x] Implement AppShell
  - Layout container (flexbox)
  - Navbar + Sidebar + content slots
  - Mobile responsive

- [x] Implement Navbar (TopBar)
  - Logo slot
  - Brand name
  - Breadcrumbs
  - Right content slot (user menu)
  - Mobile menu toggle button

- [x] Implement Sidebar (LeftNav)
  - Collapsible sidebar
  - NavItem rendering with sections
  - Footer nav section
  - Collapse toggle

- [x] Implement NavItem
  - Icon + label
  - Active state styling
  - Badge support
  - Role-based visibility (minRole prop)

- [ ] Implement MobileMenu
  - Drawer/overlay
  - Close on navigation
  - Swipe to close

- [ ] Add telemetry integration
  - Track navigation clicks
  - Track collapse/expand
  - Track mobile menu open/close

- [ ] Write tests
  - Render tests
  - Navigation behavior
  - Responsive behavior

### 3.2 User & Organization Components

- [x] Implement UserMenu
  - Trigger button (avatar + name)
  - Dropdown with sections
  - Current user info
  - Settings link
  - Logout button

- [x] Implement OrgSwitcher
  - Current org display
  - Dropdown with org list
  - Org avatars (first letter)
  - Role display
  - Create org link

- [ ] Add telemetry integration
  - Track org switches
  - Track account switches
  - Track logout

- [ ] Write tests
  - Menu open/close
  - Org switching
  - Account switching

### 3.3 Shell Customization

- [x] Add slot props to AppShell
  - `navbarRight`
  - `sidebarHeader`
  - `sidebarFooter`

- [x] Add branding props
  - `logo` (ReactNode)
  - `appName` (string)
  - `homeUrl` (string)

- [x] Add behavior props
  - `defaultCollapsed`
  - `showOrgSwitcher`

- [ ] Document customization API
  - Props reference
  - Examples for each slot
  - Styling guide

---

## Phase 4: Default Pages

### 4.1 Authentication Pages

- [x] Create package structure

  ```
  packages/pages/
  ├── src/
  │   ├── LoginPage.tsx
  │   ├── ErrorPage.tsx (includes NotFoundPage, ServerErrorPage)
  │   ├── MaintenancePage.tsx
  │   ├── LoadingPage.tsx
  │   ├── types.ts
  │   └── index.ts
  ```

- [x] Implement LoginPage
  - OAuth provider buttons (GitHub, Google, Microsoft)
  - Email/password form
  - Loading states
  - Error display
  - Redirect handling

- [x] Implement NotFoundPage
  - 404 message
  - Go home link
  - Go back button

- [x] Implement ErrorPage
  - Error code display
  - Customizable title/message
  - Go home button
  - Go back button
  - Custom actions slot

- [x] Implement ServerErrorPage
  - 500 error page preset

- [x] Implement MaintenancePage
  - Maintenance icon
  - Return time display
  - Customizable message

- [x] Implement LoadingPage
  - Full page spinner
  - Customizable message

### 4.2 User Settings Pages

- [x] Implement UserSettingsPage
  - Tab navigation (Profile, Security, Accounts)
  - Profile tab: name, avatar, email
  - Security tab: password change
  - Accounts tab: linked OAuth

- [x] Implement profile settings
  - Name edit form
  - Avatar display (change button stub)
  - Email display (read-only)

- [x] Implement security settings
  - Current password input
  - New password input
  - Confirm password
  - Password requirements display

- [x] Implement LinkedAccountsPage (integrated into UserSettingsPage accounts tab)
  - List linked accounts
  - Provider icons
  - Connect new account button
  - Disconnect account button

### 4.3 Organization Pages

- [ ] Implement OrgSettingsPage
  - Org name edit
  - Org slug display
  - Logo upload
  - Primary color picker

- [ ] Implement OrgMembersPage
  - Member list with avatars
  - Role display
  - Role change dropdown (admins only)
  - Remove member button (admins only)
  - Invite button

- [ ] Implement invite modal
  - Email input
  - Role selector
  - Send invite button

### 4.4 Platform Admin Pages

- [ ] Implement PlatformAdminPage
  - Dashboard overview
  - Stats cards (users, orgs, etc.)

- [ ] Implement organization list
  - All orgs table
  - Search/filter
  - View org link

- [ ] Implement user management
  - All users table
  - Search/filter
  - Impersonate button (for debugging)

---

## Phase 5: Design System Integration

### 5.1 Design Tokens Package

- [x] Create package structure

  ```
  packages/design-tokens/
  ├── src/
  │   ├── colors.ts (gray, primary, success, warning, error, info + semantic)
  │   ├── spacing.ts (4px base scale)
  │   ├── typography.ts (families, sizes, weights, line-heights, letter-spacing)
  │   ├── shadows.ts (box shadows + dark mode variants + focus rings)
  │   ├── radii.ts (border radius tokens)
  │   ├── breakpoints.ts (responsive breakpoints + containers)
  │   ├── animations.ts (durations, easings, transitions)
  │   ├── z-index.ts (z-index scale)
  │   └── index.ts
  ├── scripts/
  │   └── generate-css.js
  ├── dist/
  │   └── tokens.css (generated)
  ├── package.json
  └── tsconfig.json
  ```

- [x] Create colors
  - Gray scale (50-950)
  - Primary (blue) scale (50-950)
  - Success (green) scale (50-950)
  - Warning (amber) scale (50-950)
  - Error (red) scale (50-950)
  - Info (sky) scale (50-950)
  - Light mode semantic colors
  - Dark mode semantic colors

- [x] Create typography
  - Font families (sans, mono)
  - Font sizes (xs-4xl)
  - Font weights (normal-black)
  - Line heights
  - Letter spacing

- [x] Create spacing
  - 4px base scale (0-96)
  - Named sizes

### 5.2 Token Generation

- [x] Generate CSS variables
  - Custom Node.js script (generate-css.js)
  - All tokens as CSS custom properties
  - Dark mode via media query and .dark class
  - Focus ring utilities
  - Reduced motion support

- [x] Generate TypeScript exports
  - Type-safe token objects
  - Export from package

- [ ] Generate Tailwind preset (optional)
  - Export from package

- [ ] Create DSS spec files (optional)
  - LLM-friendly JSON specs

### 5.3 Dark Mode Support

- [x] Define dark mode colors
  - Inverted semantic colors
  - Adjusted contrast
  - Dark mode shadows

- [x] CSS media query support
  - `prefers-color-scheme: dark` auto-detection
  - `.dark` class for manual toggle

- [ ] Implement useTheme hook
  - Persist to localStorage
  - Respect system preference

- [ ] Test contrast ratios
  - WCAG AA compliance
  - Both themes

---

## Phase 6: App2 Migration

### 6.1 Backend Verification

- [ ] Verify BFF endpoints exist
  - `/bff/session`
  - `/bff/api/v1/users/me`
  - `/bff/logout`
  - `/bff/refresh`

- [ ] Test OAuth through BFF
  - GitHub OAuth flow
  - Google OAuth flow
  - SystemAuth OAuth flow

### 6.2 Frontend Migration

- [ ] Install packages

  ```bash
  pnpm add @plexusone/shell @plexusone/auth @plexusone/tenant @plexusone/api-client @plexusone/telemetry @plexusone/design-tokens
  ```

- [ ] Replace auth store
  - Remove `stores/auth-store.ts`
  - Add AuthProvider to app root
  - Add TenantProvider
  - Update all useAuthStore → useAuth

- [ ] Replace shell
  - Remove local layout components
  - Use `<AppShell>` from @plexusone/shell
  - Configure nav items

- [ ] Update API calls
  - Use createClient with BFF base
  - Remove Authorization header handling
  - Let cookies handle auth

- [ ] Remove localStorage usage
  - Delete token storage code
  - Remove token refresh logic
  - Verify no localStorage access

- [ ] Add telemetry
  - Add TelemetryProvider
  - Instrument key pages
  - Track critical user journeys

- [ ] Apply design tokens
  - Import tokens.css
  - Update Tailwind config

### 6.3 Testing

- [ ] Auth flow testing
  - Login via each OAuth provider
  - Logout clears session
  - Session refresh works
  - Session expiry redirects

- [ ] Shell testing
  - Navigation works
  - Org switching works
  - User menu works
  - Mobile responsive

- [ ] Security verification
  - No tokens in localStorage
  - Cookies are httpOnly
  - XSS test (no token exposure)

---

## Phase 7: App1-UI Alignment

### 7.1 Package Adoption

- [ ] Install shared packages
- [ ] Replace local AuthContext
- [ ] Replace local shell components
- [ ] Replace local API client
- [ ] Add TenantProvider
- [ ] Add telemetry instrumentation
- [ ] Apply design tokens

### 7.2 Cleanup

- [ ] Remove src/contexts/AuthContext.tsx
- [ ] Remove src/components/Layout.tsx
- [ ] Remove src/components/ProtectedRoute.tsx
- [ ] Remove local API client code
- [ ] Update all imports
- [ ] Run full test suite

---

## Phase 8: App3 Integration

### 8.1 Auth & Shell Setup

- [ ] Install packages
- [ ] Add AuthProvider
- [ ] Add TenantProvider
- [ ] Add AppShell with dashboard nav
- [ ] Create login page
- [ ] Add protected routes

### 8.2 Telemetry

- [ ] Add TelemetryProvider
- [ ] Track canvas interactions
- [ ] Track widget operations
- [ ] Track chart configurations

---

## Phase 9: Documentation & Polish

### 9.1 Documentation Site

- [ ] Set up MkDocs
  - Install mkdocs-material
  - Create docs/ structure
  - Configure navigation

- [ ] Write documentation
  - Getting started guide
  - Package API references
  - Shell customization guide
  - Migration guides
  - Troubleshooting

- [ ] Deploy docs
  - GitHub Pages setup
  - CI deployment

### 9.2 Examples

- [ ] Create example app
  - Vite + React template
  - Uses all packages
  - Demonstrates customization

- [ ] Set up Storybook
  - Shell component stories
  - Page component stories
  - Interactive docs

---

## Bugs & Issues

| ID  | Description | Status | Package |
| --- | ----------- | ------ | ------- |
|     |             |        |         |

---

## Notes

### Decision Log

| Date | Decision                          | Rationale                                            |
| ---- | --------------------------------- | ---------------------------------------------------- |
|      | Use design-system-spec for tokens | LLM-friendly, structured, generates multiple formats |
|      | Slot-based customization          | Flexible without exposing internals                  |
|      | BFF pattern mandatory             | Security best practice, no token exposure            |

### Open Questions

- [ ] Should we support React 17?
- [ ] Include Zustand adapter for gradual migration?
- [ ] Support Next.js App Router specifically?
- [ ] Add i18n support to shell components?
