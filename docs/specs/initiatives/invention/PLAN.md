# SystemForge Web - Implementation Plan

## Overview

This document outlines the phased implementation plan for SystemForge Web, an open-source React framework providing a complete web application shell for multi-tenant SaaS applications.

## Phase 1: Project Setup & Core Packages (Week 1-3)

### 1.1 Repository Setup

- [ ] Initialize monorepo with pnpm workspaces
- [ ] Configure Turborepo for build orchestration
- [ ] Set up TypeScript configuration (base + per-package)
- [ ] Configure ESLint + Prettier
- [ ] Set up Vitest for testing
- [ ] Create GitHub Actions CI workflow
- [ ] Add Changesets for versioning

**Deliverables:**

- Working monorepo structure
- CI pipeline running lint/test/build

### 1.2 Auth Package (`@plexusone/auth`)

- [ ] Extract `AuthProvider` from App1-UI
- [ ] Extract `useAuth` hook
- [ ] Extract `ProtectedRoute` component
- [ ] Create `bff-client.ts` with typed endpoints
- [ ] Add `usePermissions` hook for role checking
- [ ] Add `useLinkedAccounts` hook for account switching
- [ ] Write unit tests (>80% coverage)
- [ ] Create package documentation

**Source Reference:**

- `./reference/app1-ui/src/contexts/AuthContext.tsx`
- `./reference/app1-ui/src/components/ProtectedRoute.tsx`

**Deliverables:**

- Published `@plexusone/auth` package
- Working example in docs

### 1.3 Tenant Package (`@plexusone/tenant`)

- [ ] Create `TenantProvider` context
- [ ] Implement `useOrganization` hook
- [ ] Implement `useOrganizations` hook
- [ ] Implement `useMembership` hook
- [ ] Implement `useCurrentOrg` hook
- [ ] Create `RequireRole` component
- [ ] Add platform admin (non-tenant) support
- [ ] Write unit tests

**Deliverables:**

- Published `@plexusone/tenant` package
- Multi-org support working

## Phase 2: API Client & Telemetry (Week 3-5)

### 2.1 API Client Package (`@plexusone/api-client`)

- [ ] Implement `createClient` factory function
- [ ] Add request/response interceptors
- [ ] Implement automatic 401 handling
- [ ] Add organization context header
- [ ] Add timeout support with AbortController
- [ ] Create TanStack Query integration helpers
- [ ] Write unit tests

**Deliverables:**

- Published `@plexusone/api-client` package
- Integration guide for TanStack Query

### 2.2 Telemetry Package (`@plexusone/telemetry`)

- [ ] Define ProductGraph event schema
- [ ] Implement `TelemetryProvider` and `TelemetryEmitter`
- [ ] Create event sinks (noop, console, productgraph)
- [ ] Implement `useInstrumented` hook
- [ ] Implement `usePageView` hook
- [ ] Add automatic org_id inclusion
- [ ] Write unit tests

**Deliverables:**

- Published `@plexusone/telemetry` package
- Event schema documentation

## Phase 3: Shell Components (Week 5-7)

### 3.1 Core Shell Components

- [ ] Implement `<AppShell>` layout component
- [ ] Implement `<TopBar>` with logo, search slot, user menu
- [ ] Implement `<LeftNav>` with collapsible navigation
- [ ] Implement `<NavItem>` with active states
- [ ] Implement `<MobileMenu>` for responsive design
- [ ] Add telemetry integration to all components
- [ ] Write component tests

**Deliverables:**

- Basic shell layout working
- Responsive behavior

### 3.2 User & Organization Components

- [ ] Implement `<UserMenu>` with account switching
- [ ] Implement `<OrgSwitcher>` for multi-org users
- [ ] Add linked accounts display in UserMenu
- [ ] Add organization creation link
- [ ] Write component tests

**Deliverables:**

- User menu with account switching
- Organization switching working

### 3.3 Shell Customization

- [ ] Add slot-based customization (topBarRight, leftNavBottom)
- [ ] Add branding props (logo, brandName, colors)
- [ ] Support custom user menu component
- [ ] Add nav item badge support
- [ ] Document customization API

**Deliverables:**

- Fully customizable shell
- Documentation for all customization options

## Phase 4: Default Pages (Week 7-9)

### 4.1 Authentication Pages

- [ ] Implement `<LoginPage>` with OAuth provider buttons
- [ ] Implement OAuth callback handling
- [ ] Implement `<NotFoundPage>` (404)
- [ ] Implement `<ErrorPage>` (500)

**Deliverables:**

- Complete auth flow pages
- Error boundary integration

### 4.2 User Settings Pages

- [ ] Implement `<UserSettingsPage>` with tabs
- [ ] Profile settings tab (name, avatar, email)
- [ ] Security settings tab (password change)
- [ ] Implement `<LinkedAccountsPage>` for OAuth connections
- [ ] Add account linking/unlinking functionality

**Deliverables:**

- Complete user settings
- Linked accounts management

### 4.3 Organization Pages

- [ ] Implement `<OrgSettingsPage>` (name, logo, branding)
- [ ] Implement `<OrgMembersPage>` (member list, roles)
- [ ] Implement invite member modal
- [ ] Implement role change functionality
- [ ] Implement member removal

**Deliverables:**

- Organization management pages
- Member invitation system

### 4.4 Platform Admin Pages

- [ ] Implement `<PlatformAdminPage>` shell
- [ ] Add organization list view
- [ ] Add user management view
- [ ] Add platform settings

**Deliverables:**

- SaaS admin dashboard
- Cross-tenant visibility

## Phase 5: Design System Integration (Week 9-10)

### 5.1 Design System Spec Files

- [ ] Create `dss/meta.json` with system metadata
- [ ] Create `dss/foundations/colors.json` with brand/semantic/neutral
- [ ] Create `dss/foundations/typography.json`
- [ ] Create `dss/foundations/spacing.json`
- [ ] Create `dss/components/` specs for shell components
- [ ] Add LLM context to all component specs

**Deliverables:**

- Complete DSS specification
- LLM-ready component documentation

### 5.2 Token Generation

- [ ] Set up `dss generate` integration
- [ ] Generate CSS variables (`tokens.css`)
- [ ] Generate Tailwind preset
- [ ] Generate TypeScript exports
- [ ] Generate LLM context document

**Deliverables:**

- Automated token generation
- Multi-format exports

### 5.3 Dark Mode Support

- [ ] Define dark mode color variants
- [ ] Implement theme toggle
- [ ] Persist theme preference
- [ ] Test contrast ratios

**Deliverables:**

- Dark mode support
- Theme persistence

## Phase 6: App2 Migration (Week 10-12)

### 6.1 Backend BFF Setup

- [ ] Verify App2 backend supports BFF endpoints
- [ ] Add session cookie handling
- [ ] Test OAuth flows through BFF

### 6.2 Frontend Migration

- [ ] Replace Zustand auth store with `@plexusone/auth`
- [ ] Replace local shell with `@plexusone/shell`
- [ ] Update API calls to use `@plexusone/api-client`
- [ ] Remove localStorage token handling
- [ ] Add telemetry instrumentation
- [ ] Apply design tokens

### 6.3 Testing & Validation

- [ ] Test all auth flows
- [ ] Verify no tokens in localStorage
- [ ] Security review

**Deliverables:**

- App2 using SystemForge Web
- Security issues resolved

## Phase 7: App1-UI Alignment (Week 12-14)

### 7.1 Package Adoption

- [ ] Replace local auth code with `@plexusone/auth`
- [ ] Replace local shell with `@plexusone/shell`
- [ ] Replace local API client with `@plexusone/api-client`
- [ ] Add telemetry instrumentation
- [ ] Apply design tokens

### 7.2 Cleanup

- [ ] Remove duplicated code
- [ ] Update imports
- [ ] Verify all tests pass

**Deliverables:**

- App1-UI using shared packages
- Reduced code duplication

## Phase 8: App3 Integration (Week 14-15)

### 8.1 Auth & Shell Setup

- [ ] Add `@plexusone/auth` to App3
- [ ] Add `@plexusone/shell` layout
- [ ] Implement login flow
- [ ] Add protected routes

### 8.2 Telemetry

- [ ] Add telemetry provider
- [ ] Instrument canvas interactions
- [ ] Track dashboard operations

**Deliverables:**

- App3 with full SystemForge Web integration

## Phase 9: Documentation & Polish (Week 15-16)

### 9.1 Documentation Site

- [ ] Set up MkDocs documentation
- [ ] Write getting started guide
- [ ] Document each package API
- [ ] Add shell customization guide
- [ ] Add migration guides
- [ ] Add troubleshooting guide

### 9.2 Examples

- [ ] Create example app using all packages
- [ ] Add Storybook for shell components
- [ ] Create integration examples

**Deliverables:**

- Published documentation site
- Example application
- Storybook component explorer

---

## Risk Mitigation

### Risk: Shell too opinionated

**Mitigation:**

- Slot-based customization
- Composable components
- Allow overriding any sub-component

### Risk: Breaking changes during migration

**Mitigation:**

- Maintain backwards compatibility
- Use feature flags during transition
- Test extensively before merging

### Risk: Design system complexity

**Mitigation:**

- Use design-system-spec for structured definitions
- Generate tokens automatically
- Provide sensible defaults

---

## Success Criteria

| Criterion                     | Target   | Verification                |
| ----------------------------- | -------- | --------------------------- |
| All 3 apps using shared shell | 100%     | Package imports in each app |
| App2 security issue fixed     | Yes      | No tokens in localStorage   |
| Test coverage                 | >80%     | CI coverage reports         |
| Bundle size targets met       | Yes      | Bundle analyzer             |
| Documentation complete        | Yes      | All packages documented     |
| Shell customization time      | < 30 min | User testing                |
| WCAG 2.1 AA compliance        | Yes      | Accessibility audit         |

---

## Dependencies

### External

- React 18/19
- React Router 6/7
- TypeScript 5.x
- pnpm 8+
- Node.js 20+
- design-system-spec CLI (`dss`)

### Internal

- SystemForge backend (BFF endpoints)
- ProductGraph (telemetry sink)
- design-system-spec (token format)

---

## Timeline Summary

```
Week 1-3:   Setup + Auth + Tenant packages
Week 3-5:   API Client + Telemetry packages
Week 5-7:   Shell components
Week 7-9:   Default pages
Week 9-10:  Design system integration
Week 10-12: App2 migration
Week 12-14: App1-UI alignment
Week 14-15: App3 integration
Week 15-16: Documentation & Polish
```

Total: ~16 weeks to full adoption across all applications.
