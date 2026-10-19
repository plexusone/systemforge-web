/**
 * @plexusone/console
 *
 * The SystemForge organization console: an organization's connections to
 * external services, connected step by step from each service's manifest.
 * SystemAuth serves the pages under `/console` and signs them in with its
 * login session.
 *
 * @example
 * ```tsx
 * import { createHost } from '@plexusone/host';
 * import { CONSOLE_BASENAME, consoleApp, consoleSessionClient } from '@plexusone/console';
 *
 * createRoot(root).render(
 *   createHost({ app: consoleApp, shell: MyShell, sessionClient: consoleSessionClient(), basename: CONSOLE_BASENAME })
 * );
 * ```
 *
 * @packageDocumentation
 */
export { consoleApp, CONSOLE_APP_ID } from './app';
export { consoleSessionClient, CONSOLE_BFF_BASE, CONSOLE_BASENAME } from './session';
export { api, ApiError, API_BASE } from './api';
export { Connections } from './pages/Connections';
export { Gallery } from './pages/Gallery';
export { Connect } from './pages/Connect';
export type {
  AuthMethod,
  Connection,
  ConnectionState,
  Field,
  Health,
  Manifest,
  RotationMode,
  Scope,
  SetupStep,
} from './types';
