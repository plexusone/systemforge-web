# PRD — Shell Foundations — Session, App Catalog, Organizations and Slots for Composed Apps

**Initiative:** `INIT-SYSTEMFORGEWEB-001`
**Repository:** `github.com/plexusone/systemforge-web`
**Related:** `INIT-SYSTEMFORGE-001` (Phase 3, Shell Composition)

## Summary

`@plexusone/shell` should be the one chrome every SystemForge application
uses: the top bar, the product switcher, the organization switcher, the
profile menu and the places an application puts its own controls. Today the
package has the pieces (`AppShell`, `Navbar`, `OrgSwitcher`, `UserMenu`,
`Breadcrumbs`) but none of the data model SystemForge's relying party
actually serves, so applications built on SystemForge write their own top
bars instead. This initiative closes that gap.

## Problem

- **Applications copy the chrome.** Each application on a SystemForge
  deployment builds its own top bar, product switcher and profile menu. They
  drift in behavior (how the switcher filters, how switching organization
  works) and in look, and a fix has to be made once per application.
- **The shell speaks a different session.** `@plexusone/auth` targets
  email-and-password routes and a user with one role per membership. The
  relying-party BFF serves `/bff/session`: the user, memberships with a role
  per application, and the deployment's application catalog. The shell cannot
  see per-application roles or the catalog.
- **Organization switching does not fit.** The shell keeps the current
  organization in local storage. SystemForge applications put the
  organization in the URL and in API paths, keyed by organization ID.
- **No place for an application's own controls.** Search, notifications or a
  product's action menu can only be added by forking the navbar.
- **Two composition modes, one shell.** Some deployments build several
  applications into one front end (the Forge composition of
  `INIT-SYSTEMFORGE-001`). Others serve each application from its own host
  and link them through the app catalog. The shell has to serve both.

## Users

| User                  | Needs                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Application developer | Drop in the shell, pass the application's identity and slots, and get sign-in, switching and the profile menu working against SystemForge |
| Deployment operator   | Applications that look and behave as one product, with the catalog deciding what appears                                                  |
| End user              | One consistent way to move between products and organizations, see who is signed in, and sign out                                         |

## Goals

1. A session model over the relying-party BFF, exposing memberships with
   per-application roles and the app catalog.
2. A product switcher built from the catalog that shows only the
   applications the person holds a role in for the current organization, with
   the current application always first.
3. An organization switcher that is controlled by the application and keyed
   by organization ID.
4. Named slots for an application's own content in the top bar.
5. Theme, profile menu, tooltips and accessibility handled once.
6. A brand configuration interface, so a deployment can skin the shell
   without forking it.
7. A documented baseline: React version, styling delivery and test setup.

## Non-goals

- Page content, dashboards or application-specific screens.
- The `ForgeApp` registration contract and the reference composed host
  (`RMI-SYSTEMFORGEWEB-002` and `-003` in `INIT-SYSTEMFORGE-001`). This
  initiative provides what they build on.
- Customer-embedded mode (embedding one capability into a third-party
  product).
- Server changes, beyond what the BFF already serves.

## Success criteria

- An application renders the full chrome with `<AppShell>` and its own
  identity, with no top-bar code of its own.
- The switcher, organization switcher and profile menu behave the same in
  every application, covered by the package's tests.
- A deployment changes its look through brand configuration alone.
- Both composition modes are documented and covered by an example.

## Risks

- **Styling.** The shell uses Tailwind classes. Applications that do not use
  Tailwind need compiled CSS, or adopting the shell means adopting Tailwind.
- **React baseline.** The packages require React 19; applications on React
  18 must upgrade to adopt the shell.
- **Over-fitting.** The session model must follow what the BFF serves, not
  one deployment's conventions.
