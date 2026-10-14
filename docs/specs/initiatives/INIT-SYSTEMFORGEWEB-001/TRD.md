# TRD — Shell Foundations — Session, App Catalog, Organizations and Slots for Composed Apps

**Initiative:** `INIT-SYSTEMFORGEWEB-001`
**Repository:** `github.com/plexusone/systemforge-web`

## Current state

| Package             | Has                                                                                                                           | Missing for this initiative                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `@plexusone/shell`  | `AppShell`, `Navbar`, `Sidebar`, `OrgSwitcher`, `UserMenu`, `Breadcrumbs`, `ShellContext`                                     | Product switcher, slots, theme, brand config, controlled organization switching, tests |
| `@plexusone/auth`   | `AuthProvider`, `BFFClient` (`/bff/api/v1/users/me`, `/bff/auth/login` with credentials, register, password, linked accounts) | `/bff/session`, per-application roles, the app catalog, redirect sign-in               |
| `@plexusone/tenant` | `TenantProvider` with the current organization in local storage                                                               | Organization from the URL, switching through the application                           |
| `@plexusone/ui`     | `Avatar`, `DropdownMenu`, `Tooltip`, `Button`, icons, Tailwind preset                                                         | Compiled CSS for consumers without Tailwind                                            |

All packages declare `react ^19.0.0` as a peer dependency.

## Composition modes

The shell supports two ways of composing applications. Everything in this
initiative works in both.

|                             | Single build                                                       | Per host                                                                   |
| --------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Applications                | Registered into one front end (`ForgeApp`, `INIT-SYSTEMFORGE-001`) | Each built and deployed on its own host                                    |
| Moving between applications | Client-side route change                                           | A link to another host, full page load                                     |
| Product switcher entries    | Registered applications                                            | The deployment's app catalog                                               |
| Session                     | One BFF session                                                    | One BFF session per host, one sign-in through the shared identity provider |

## Session

A `SessionProvider` reads `/bff/session` from the relying-party BFF:

```ts
interface Session {
  authenticated: boolean;
  user?: SessionUser;
  apps: CatalogApp[]; // the deployment's application catalog
}
interface SessionUser {
  id: string; // principal ID
  name?: string;
  email?: string;
  avatarUrl?: string;
  memberships: Membership[];
}
interface Membership {
  organizationId: string; // the key; never a slug
  organizationName?: string;
  organizationSlug?: string; // display only
  role?: string; // organization role
  applications: Record<string, string>; // application ID -> role
}
interface CatalogApp {
  id: string;
  name: string;
  url: string;
  icon?: string;
}
```

- Field names map from the BFF's JSON in one adapter, so the BFF's wire
  format does not leak into components.
- Sign-in redirects to `/bff/auth/login?return_to=` or a provider route.
  Sign-out posts to `/bff/auth/logout`. No credentials pass through the
  shell.
- The provider re-reads the session on focus and on an interval, and
  exposes `onUnauthorized` so an application can redirect.
- `@plexusone/auth`'s email-and-password flows stay available for
  deployments that use them; they are not the default.

## Product switcher

```ts
function switcherApps(apps: CatalogApp[], self: CatalogApp, membership?: Membership): CatalogApp[];
```

- Shows catalog applications in which the member holds a role for the
  current organization (`membership.applications[app.id]`).
- The current application is always present and first, and marked
  `aria-current="page"`.
- With an empty catalog (local development) it shows the current
  application alone.
- Entries for other hosts are links. In single-build mode the application
  can supply `onNavigate` for client-side routing.

This rule is a pure function with unit tests, and the component renders it.

## Organization switcher

- Controlled: `value` (organization ID) and `onChange(organizationId)`. The
  application decides how the organization is carried, normally in the URL.
- Lists the person's memberships by name, falling back to slug, then ID.
- Hidden with one membership unless `alwaysShow` is set.
- `@plexusone/tenant`'s local-storage behavior remains as an opt-in
  uncontrolled mode.

## Slots

`AppShell` and `Navbar` accept named slots:

| Slot           | Position                   | Typical content                        |
| -------------- | -------------------------- | -------------------------------------- |
| `brand`        | Start                      | Overrides the brand from configuration |
| `command`      | After the product switcher | Search or command bar                  |
| `actions`      | Before the profile menu    | Product actions, notifications         |
| `breadcrumbs`  | Below or beside the bar    | Location within the application        |
| `profileItems` | Inside the profile menu    | Application links                      |

A slot is `ReactNode`. The shell owns layout, spacing and responsive
behavior; content is the application's.

## Chrome

- **Theme:** light, dark and system, applied as `data-theme` on the root
  element and persisted in local storage, wrapped so a storage failure falls
  back to system.
- **Profile menu:** name, email, avatar, the current organization and the
  role held in this application, `profileItems`, and sign out. No default
  links to pages an application may not have.
- **Tooltips:** icon-only controls use the `ui` tooltip and carry an
  accessible name.
- **Accessibility:** menus close on Escape and outside click, focus
  returns to the trigger, and the switchers are keyboard operable.
- **Responsive:** below a breakpoint the switcher and organization switcher
  collapse into one menu.
- **Navigation model:** sidebar, top tabs, or none, chosen by the
  application.

## Brand configuration

```ts
interface BrandConfig {
  name: string; // wordmark text
  logo?: ReactNode;
  tokens?: Partial<DesignTokens>; // from @plexusone/design-tokens
  productLabel?: string; // suffix such as "platform"
}
```

A deployment publishes its brand as a small package that exports a
`BrandConfig` and, optionally, a preconfigured shell component. The shell
never names a deployment.

## Baseline

| Concern       | Choice                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| React         | 19, as the packages already require                                                                                                             |
| Router        | Not required by the shell; `onNavigate` adapts to any router                                                                                    |
| Styling       | Tailwind preset for Tailwind consumers, plus compiled CSS in `@plexusone/shell/styles.css` for others (decided in an ADR under this initiative) |
| Tests         | Vitest and Testing Library, already configured at the workspace root                                                                            |
| Shared config | Published TypeScript, lint and test presets, so an application adopts the baseline with one dependency                                          |

## Testing

- Unit tests for `switcherApps`, the session adapter and the
  organization-label fallback.
- Component tests for each switcher and the profile menu: rendering,
  keyboard use, Escape and outside click, `aria-current`.
- A session fixture covering an empty catalog, one membership, several
  memberships and an application the person holds no role in.

## Compatibility

- Existing exports keep working. `OrgSwitcher`'s uncontrolled mode and
  `UserMenu`'s actions stay, with the defaults changed to empty, which is
  noted in the changelog.
- Field-name changes are confined to the new session types; existing
  `@plexusone/auth` types are not renamed.
