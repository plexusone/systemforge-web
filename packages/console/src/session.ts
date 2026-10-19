import { SessionClient } from '@plexusone/auth';

/** Where SystemAuth serves the console's session routes. */
export const CONSOLE_BFF_BASE = '/console/bff';

/** The base path the console's pages are served under. */
export const CONSOLE_BASENAME = '/console';

/**
 * consoleSessionClient reads the console's session from SystemAuth, signed
 * in with the SystemAuth login session.
 */
export function consoleSessionClient(): SessionClient {
  return new SessionClient({ basePath: CONSOLE_BFF_BASE });
}
