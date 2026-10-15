/**
 * @plexusone/host
 *
 * Host SystemForge applications. An application exports an AppModule; a
 * stack hosts it with its own Shell through createHost, and the same module
 * runs on its own in DevShell.
 *
 * @packageDocumentation
 */
export type { AppContext, AppModule, Shell, ShellProps } from './types';
export { AppContextProvider, useAppContext } from './context';
export { createHost, HostRoutes, HostSession } from './createHost';
export type { HostOptions } from './createHost';
export { DevShell } from './DevShell';
export { devSession, devSessionClient } from './devSession';
export type { DevSessionOptions } from './devSession';
export {
  HostPanel,
  NoAccessPage,
  NoOrganizationPage,
  NotFoundPage,
  SessionErrorPage,
} from './pages';
