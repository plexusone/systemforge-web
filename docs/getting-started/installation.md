# Installation

## Prerequisites

- Node.js 20+
- pnpm 9+ (recommended) or npm

## Install Packages

Install the packages you need:

```bash
# Core packages (recommended starting point)
pnpm add @plexusone/auth @plexusone/tenant @plexusone/shell

# Optional packages
pnpm add @plexusone/api-client    # HTTP client
pnpm add @plexusone/telemetry     # Event tracking
pnpm add @plexusone/pages         # Pre-built pages
pnpm add @plexusone/design-tokens # Design tokens
```

## Peer Dependencies

SystemForge Web packages have the following peer dependencies:

```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

Some packages have additional peer dependencies:

| Package                 | Additional Peers        |
| ----------------------- | ----------------------- |
| `@plexusone/api-client` | `@tanstack/react-query` |
| `@plexusone/shell`      | `react-router-dom`      |
| `@plexusone/pages`      | `react-router-dom`      |

## TypeScript

All packages include TypeScript declarations. No additional `@types/*` packages needed.

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

## Framework Support

SystemForge Web works with any React framework:

- **Vite** - Recommended for new projects
- **Next.js** - Use with App Router (client components)
- **Remix** - Full support
- **Create React App** - Supported but not recommended for new projects
