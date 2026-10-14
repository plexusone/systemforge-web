# ROADMAP — Shell Foundations — Session, App Catalog, Organizations and Slots for Composed Apps

**Initiative:** `INIT-SYSTEMFORGEWEB-001`
**Repository:** `github.com/plexusone/systemforge-web`

## Phase 1 — Session and Switching

**Theme:** The shell reads the session SystemForge serves and switches products and organizations from it

- [x] `RMI-SYSTEMFORGEWEB-006` Session provider over the relying-party BFF: `/bff/session` with memberships, per-application roles and the app catalog; redirect sign-in and sign-out
- [x] `RMI-SYSTEMFORGEWEB-007` Product switcher from the app catalog: role-filtered, current application first, links across hosts or client-side navigation
  - Depends on: `RMI-SYSTEMFORGEWEB-006`
- [x] `RMI-SYSTEMFORGEWEB-008` Controlled organization switcher keyed by organization ID, with the uncontrolled mode kept as opt-in
  - Depends on: `RMI-SYSTEMFORGEWEB-006`
- [x] `RMI-SYSTEMFORGEWEB-009` Shell test suite: session fixtures, switcher rules and component behavior
  - Depends on: `RMI-SYSTEMFORGEWEB-007`
  - Depends on: `RMI-SYSTEMFORGEWEB-008`
- [x] `RMI-SYSTEMFORGEWEB-010` Composition modes guide: one build and one host per application, with an example of each

## Phase 2 — Chrome

**Theme:** The top bar every application needs, with room for each application's own controls

- [x] `RMI-SYSTEMFORGEWEB-011` Named slots in AppShell and Navbar: brand, command, actions, breadcrumbs and profile items
- [x] `RMI-SYSTEMFORGEWEB-012` Theme: light, dark and system on the root element, persisted with a fallback when storage is unavailable
- [x] `RMI-SYSTEMFORGEWEB-013` Profile menu: identity, current organization and application role, profile items and sign out, with no default links
  - Depends on: `RMI-SYSTEMFORGEWEB-006`
- [ ] `RMI-SYSTEMFORGEWEB-014` Tooltips and accessibility: tooltip on icon controls, keyboard operation, Escape and outside click, focus return
- [ ] `RMI-SYSTEMFORGEWEB-015` Responsive top bar and a navigation model option: sidebar, top tabs or none
  - Depends on: `RMI-SYSTEMFORGEWEB-011`

## Phase 3 — Brand and Baseline

**Theme:** A deployment skins the shell without forking it, and adopts the baseline with one dependency

- [ ] `RMI-SYSTEMFORGEWEB-016` Brand configuration interface: name, logo, product label and design tokens
- [ ] `RMI-SYSTEMFORGEWEB-017` Styling delivery ADR and compiled shell CSS for applications without Tailwind
- [ ] `RMI-SYSTEMFORGEWEB-018` Baseline presets: TypeScript, lint and test configuration published for applications
- [ ] `RMI-SYSTEMFORGEWEB-019` Release the shell foundations with migration notes for existing consumers
  - Depends on: `RMI-SYSTEMFORGEWEB-016`
  - Depends on: `RMI-SYSTEMFORGEWEB-017`
  - Depends on: `RMI-SYSTEMFORGEWEB-018`
