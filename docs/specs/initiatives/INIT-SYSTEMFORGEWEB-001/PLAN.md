# PLAN — Shell Foundations — Session, App Catalog, Organizations and Slots for Composed Apps

**Initiative:** `INIT-SYSTEMFORGEWEB-001`
**Repository:** `github.com/plexusone/systemforge-web`

## Approach

Build from the data up: the session model first, because the switchers,
the profile menu and the brand all read from it. Then the chrome, then the
brand and baseline that let a deployment adopt the shell without forking it.
Each phase is releasable, and existing exports keep working throughout.

## Phase 1 — Session and Switching

1. Add the session types and an adapter from the BFF's `/bff/session` JSON,
   with fixtures for the cases in the TRD.
2. Add `SessionProvider` and `useSession`, with redirect sign-in, sign-out,
   refresh on focus and an `onUnauthorized` hook.
3. Add `switcherApps` as a pure function with tests, then the
   `ProductSwitcher` component.
4. Make `OrgSwitcher` controllable by `value` and `onChange`, keyed by
   organization ID, and keep the current behavior behind an opt-in.
5. Write the composition modes guide and two examples.

Exit: an example application on one host and an example with two
registered applications both render the switchers from a fixture session.

## Phase 2 — Chrome

1. Add the slots to `Navbar` and `AppShell`, keeping current props as
   defaults.
2. Add the theme toggle and its storage fallback.
3. Rework `UserMenu` into the profile menu: empty default actions,
   organization and role rows, `profileItems`.
4. Apply the `ui` tooltip to icon-only controls and add keyboard and focus
   tests.
5. Add the responsive collapse and the navigation model option.

Exit: an application needs no top-bar code of its own; the component tests
cover keyboard use and focus.

## Phase 3 — Brand and Baseline

1. Define `BrandConfig` and apply tokens through `@plexusone/design-tokens`.
2. Decide styling delivery in an ADR and ship compiled CSS.
3. Publish TypeScript, lint and test presets.
4. Release, with migration notes for the changed `UserMenu` defaults and
   the new organization switcher mode.

Exit: a deployment's brand package changes the look with no shell fork, and
the release notes cover every behavior change.

## Testing

Vitest and Testing Library at the workspace root. Every RMI adds or updates
tests in the package it changes; the session fixtures are shared.

## Dependencies

- The relying-party BFF's `/bff/session` response, as served by SystemForge.
- `INIT-SYSTEMFORGE-001` Phase 3 builds its registration contract and
  reference host on this initiative's session, switchers and slots.
