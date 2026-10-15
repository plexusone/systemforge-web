# Packages Overview

SystemForge Web is a monorepo of focused packages, published to npm under
`@plexusone`. Install only the ones an application needs.

## How they depend on each other

```text
@plexusone/shell ──┬──▶ @plexusone/auth
                   ├──▶ @plexusone/tenant ──▶ @plexusone/auth
                   └──▶ @plexusone/ui

@plexusone/pages ─────▶ @plexusone/auth

Standalone: @plexusone/api-client, @plexusone/chat,
            @plexusone/design-tokens, @plexusone/telemetry
```

An arrow is a peer dependency: the application installs both, and they
share one copy. Every package also needs React 19.

## Package summary

| Package                                      | Purpose                            | Key exports                                                          |
| -------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| [@plexusone/api-client](api-client.md)       | HTTP client                        | `ApiProvider`, `useApiClient`, `createApiClient`                     |
| [@plexusone/auth](auth.md)                   | Authentication and the BFF session | `SessionProvider`, `useSession`, `AuthProvider`, `ProtectedRoute`    |
| [@plexusone/chat](chat.md)                   | Chat components                    | `ChatProvider`, `ChatWidget`, `ChatEmbed`                            |
| [@plexusone/design-tokens](design-tokens.md) | Design system                      | Colors, typography, spacing                                          |
| [@plexusone/pages](pages.md)                 | Pre-built pages                    | `LoginPage`, `ErrorPage`, `OrganizationSettingsPage`                 |
| [@plexusone/shell](shell.md)                 | Application chrome                 | `AppShell`, `ProductSwitcher`, `OrganizationSwitcher`, `ProfileMenu` |
| [@plexusone/telemetry](telemetry.md)         | Instrumentation                    | `TelemetryProvider`, `ErrorBoundary`                                 |
| [@plexusone/tenant](tenant.md)               | Multi-tenancy                      | `TenantProvider`, `RequireRole`, `useOrganization`                   |
| [@plexusone/ui](ui.md)                       | UI components                      | `Button`, `Card`, `DropdownMenu`, `Tooltip`                          |

## Choosing packages

**An application on a SystemForge relying party** (the BFF at `/bff`), with
the shared chrome:

```bash
pnpm add @plexusone/shell @plexusone/auth @plexusone/tenant @plexusone/ui
```

**Authentication only:**

```bash
pnpm add @plexusone/auth
```

**Components only:**

```bash
pnpm add @plexusone/ui
```
