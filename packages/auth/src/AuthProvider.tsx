import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { BFFClient } from './bff-client';
import type {
  User,
  AuthConfig,
  AuthContextValue,
  LoginCredentials,
  RegisterData,
  AuthError,
  OAuthProvider,
} from './types';

/**
 * Auth context
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session expired event name
 */
export const SESSION_EXPIRED_EVENT = 'systemforge:session-expired';

/**
 * Props for AuthProvider
 */
export interface AuthProviderProps extends AuthConfig {
  children: ReactNode;
}

/**
 * AuthProvider component - Manages authentication state
 *
 * @example
 * ```tsx
 * <AuthProvider
 *   bffBaseUrl=""
 *   loginUrl="/login"
 *   onSessionExpired={() => toast.error('Session expired')}
 * >
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({
  children,
  bffBaseUrl = '',
  loginUrl: _loginUrl = '/login',
  defaultRedirect: _defaultRedirect = '/',
  onSessionExpired,
  onAuthError,
  checkInterval = 60000,
}: AuthProviderProps) {
  // loginUrl and defaultRedirect are stored in config for other components
  void _loginUrl;
  void _defaultRedirect;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const client = useMemo(() => new BFFClient(bffBaseUrl), [bffBaseUrl]);

  /**
   * Handle auth errors
   */
  const handleError = useCallback(
    (err: AuthError) => {
      setError(err);
      onAuthError?.(err);
    },
    [onAuthError]
  );

  /**
   * Handle session expiry
   */
  const handleSessionExpired = useCallback(() => {
    setUser(null);
    onSessionExpired?.();
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }, [onSessionExpired]);

  /**
   * Fetch current user
   */
  const fetchUser = useCallback(async () => {
    try {
      const userData = await client.getUser();
      setUser(userData);
      setError(null);
      return userData;
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code === 'UNAUTHORIZED') {
        setUser(null);
      } else {
        handleError(authError);
      }
      return null;
    }
  }, [client, handleError]);

  /**
   * Check session validity
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const session = await client.getSession();
      if (!session.authenticated) {
        handleSessionExpired();
        return false;
      }
      return true;
    } catch {
      handleSessionExpired();
      return false;
    }
  }, [client, handleSessionExpired]);

  /**
   * Login with email/password
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        const userData = await client.login(credentials);
        setUser(userData);
      } catch (err) {
        handleError(err as AuthError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, handleError]
  );

  /**
   * Login with OAuth provider
   */
  const loginWithOAuth = useCallback(
    (provider: OAuthProvider) => {
      const returnTo = window.location.pathname;
      client.loginWithOAuth(provider, returnTo);
    },
    [client]
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (data: RegisterData) => {
      setIsLoading(true);
      setError(null);
      try {
        const userData = await client.register(data);
        setUser(userData);
      } catch (err) {
        handleError(err as AuthError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, handleError]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await client.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      // Even if logout fails on server, clear local state
      setUser(null);
      handleError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  /**
   * Change password
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setError(null);
      try {
        await client.changePassword(currentPassword, newPassword);
      } catch (err) {
        handleError(err as AuthError);
        throw err;
      }
    },
    [client, handleError]
  );

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(
    async (email: string) => {
      setError(null);
      try {
        await client.requestPasswordReset(email);
      } catch (err) {
        handleError(err as AuthError);
        throw err;
      }
    },
    [client, handleError]
  );

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      setError(null);
      try {
        await client.resetPassword(token, newPassword);
      } catch (err) {
        handleError(err as AuthError);
        throw err;
      }
    },
    [client, handleError]
  );

  /**
   * Initial fetch of the current user on mount.
   *
   * This must NOT depend on `user` - fetchUser() calls setUser() internally,
   * so a `user` dependency here would re-run this effect every time the
   * fetch resolves (even on success, since each response is a new object
   * reference), creating an infinite fetch loop with no delay.
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      await fetchUser();
      if (mounted) {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  /**
   * Periodic session check while logged in. Split from the initial-fetch
   * effect above so depending on `user` here (to start/stop polling based on
   * login state) doesn't also re-trigger the initial fetch.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const interval = setInterval(() => {
      checkSession();
    }, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [user, checkSession, checkInterval]);

  /**
   * Listen for session expired events from other parts of the app
   */
  useEffect(() => {
    const handler = () => {
      handleSessionExpired();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
    };
  }, [handleSessionExpired]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      loginWithOAuth,
      logout,
      register,
      refreshUser,
      checkSession,
      changePassword,
      requestPasswordReset,
      resetPassword,
    }),
    [
      user,
      isLoading,
      error,
      login,
      loginWithOAuth,
      logout,
      register,
      refreshUser,
      checkSession,
      changePassword,
      requestPasswordReset,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 *
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, logout } = useAuth();
 *
 *   return (
 *     <div>
 *       <span>Hello, {user?.name}</span>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Get auth context without throwing (returns null if not in provider)
 */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
