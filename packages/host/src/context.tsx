import { createContext, useContext } from 'react';
import type { AppContext } from './types';

const Context = createContext<AppContext | null>(null);

/** Provides AppContext to an application's pages. createHost does this. */
export const AppContextProvider = Context.Provider;

/** The organization and role an application's page runs in. */
export function useAppContext(): AppContext {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useAppContext must be used inside an application hosted by createHost');
  }
  return ctx;
}
