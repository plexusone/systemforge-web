import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';
import type { NavSection, UserAction } from '@plexusone/shell';

/**
 * AppContext is what an application's pages know about where they run: the
 * organization in the URL and the role held in this application there.
 */
export interface AppContext {
  /** The organization's ID, from the URL. */
  organizationId: string;
  /** The role the person holds in this application in that organization. */
  role?: string;
  /** Navigates within the organization: `navigate('sites/42')` opens `/orgs/{id}/sites/42`. */
  navigate: (path: string) => void;
}

/**
 * AppModule is an application: its pages and what it contributes to the
 * chrome. It never imports a shell, so the same module runs on its own in
 * DevShell and inside any stack's shell.
 */
export interface AppModule {
  /** The application's ID in the app catalog and in membership roles. */
  id: string;
  /** What the product switcher and the chrome show. */
  name: string;
  /** The application's pages, relative to `/orgs/:org`. An index route is its home. */
  routes: RouteObject[];
  /** The application's navigation for the current organization. */
  navigation?: (context: AppContext) => NavSection[];
  /** The application's entries in the profile menu. */
  profileItems?: (context: AppContext) => UserAction[];
  /** A search or command bar for the top bar. */
  command?: ReactNode;
  /** The application's own actions, before the profile menu. */
  actions?: ReactNode;
}

/** What createHost gives a shell. */
export interface ShellProps {
  /** The application being hosted. */
  app: AppModule;
  /** Where it runs. */
  context: AppContext;
  /** Called with the organization the person chose; the host navigates. */
  onOrganizationChange: (organizationId: string) => void;
  /** The application's routes, rendered for the current URL. */
  children: ReactNode;
}

/**
 * Shell is a stack's chrome around an application. Swapping the shell
 * changes how an application looks without changing the application.
 */
export type Shell = (props: ShellProps) => ReactNode;
