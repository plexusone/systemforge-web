import { createContext, useContext, type ReactNode } from 'react';
import type { CatalogApp } from '@plexusone/auth';
import type { Connection } from './types';

/** A link to what to do with a connection next, such as adding sites in a product. */
export interface NextStep {
  label: string;
  /** An absolute URL, usually another application in the catalog. */
  href: string;
}

/**
 * NextSteps lists, for a connection, where it is used next. The host
 * supplies it: the console itself does not know the products.
 */
export type NextSteps = (
  connection: Connection,
  context: { organizationId: string; apps: CatalogApp[] }
) => NextStep[];

/** Options for createConsoleApp. */
export interface ConsoleOptions {
  /** Links shown after connecting and on each usable connection. */
  nextSteps?: NextSteps;
}

const OptionsContext = createContext<ConsoleOptions>({});

export function ConsoleOptionsProvider({
  value,
  children,
}: {
  value: ConsoleOptions;
  children: ReactNode;
}): ReactNode {
  return <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>;
}

export function useConsoleOptions(): ConsoleOptions {
  return useContext(OptionsContext);
}
