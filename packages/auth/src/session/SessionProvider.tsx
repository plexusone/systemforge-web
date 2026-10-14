import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SessionClient, type SignInOptions } from './client';
import type { Session } from './types';

/** Where the session is in its lifecycle. */
export type SessionStatusKind = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/** What {@link useSession} returns. */
export interface SessionContextValue {
  status: SessionStatusKind;
  /** The last session read; unauthenticated and empty until the first read. */
  session: Session;
  /** The last read's error, when status is `error`. */
  error?: Error;
  /** Reads the session again. */
  refresh: () => Promise<void>;
  /** Sends the browser to sign in. */
  signIn: (opts?: SignInOptions) => void;
  /** Ends the session, then reads it again. */
  signOut: () => Promise<void>;
}

/** Props for {@link SessionProvider}. */
export interface SessionProviderProps {
  children: ReactNode;
  /** The BFF client. Default one at `/bff`. */
  client?: SessionClient;
  /** Re-read the session this often, in milliseconds; 0 turns it off. Default 5 minutes. */
  refreshInterval?: number;
  /** Re-read the session when the window regains focus. Default true. */
  refreshOnFocus?: boolean;
  /** Called when a session that was signed in is found signed out. */
  onUnauthorized?: () => void;
  /** Navigation for sign-in, for tests. Default `window.location.assign`. */
  navigate?: (url: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const signedOut: Session = { authenticated: false, apps: [] };

/**
 * Provides the browser session read from the relying-party BFF: the person,
 * their memberships with a role per application, and the app catalog.
 */
export function SessionProvider({
  children,
  client,
  refreshInterval = 5 * 60 * 1000,
  refreshOnFocus = true,
  onUnauthorized,
  navigate,
}: SessionProviderProps) {
  const bff = useMemo(() => client ?? new SessionClient(), [client]);
  const [status, setStatus] = useState<SessionStatusKind>('loading');
  const [session, setSession] = useState<Session>(signedOut);
  const [error, setError] = useState<Error | undefined>();
  const wasAuthenticated = useRef(false);
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const refresh = useCallback(async () => {
    try {
      const s = await bff.getSession();
      setSession(s);
      setError(undefined);
      setStatus(s.authenticated ? 'authenticated' : 'unauthenticated');
      if (wasAuthenticated.current && !s.authenticated) {
        onUnauthorizedRef.current?.();
      }
      wasAuthenticated.current = s.authenticated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
    }
  }, [bff]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!refreshOnFocus || typeof window === 'undefined') return undefined;
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh, refreshOnFocus]);

  useEffect(() => {
    if (!refreshInterval) return undefined;
    const id = setInterval(() => void refresh(), refreshInterval);
    return () => clearInterval(id);
  }, [refresh, refreshInterval]);

  const signIn = useCallback(
    (opts?: SignInOptions) => {
      const url = bff.signInUrl(opts);
      if (navigate) navigate(url);
      else window.location.assign(url);
    },
    [bff, navigate]
  );

  const signOut = useCallback(async () => {
    await bff.signOut();
    // Signing out on purpose is not an unauthorized surprise.
    wasAuthenticated.current = false;
    await refresh();
  }, [bff, refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, session, error, refresh, signIn, signOut }),
    [status, session, error, refresh, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** The session from the nearest {@link SessionProvider}. */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}

/** Like {@link useSession}, but undefined outside a provider. */
export function useSessionOptional(): SessionContextValue | undefined {
  return useContext(SessionContext) ?? undefined;
}
