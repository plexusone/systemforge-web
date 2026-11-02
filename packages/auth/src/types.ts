import type { SystemAuthSignOut } from './signout';

/**
 * User representation from the SystemForge backend
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  memberships: Membership[];
  created_at: string;
  updated_at?: string;
}

/**
 * Organization membership
 */
export interface Membership {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: Role;
  joined_at: string;
}

/**
 * Role hierarchy: guest < member < admin < owner < platform_admin
 */
export type Role = 'guest' | 'member' | 'admin' | 'owner' | 'platform_admin';

/**
 * Role level for hierarchy comparison
 */
export const ROLE_LEVELS: Record<Role, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  owner: 3,
  platform_admin: 100,
};

/**
 * Linked OAuth account
 */
export interface LinkedAccount {
  id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  linked_at: string;
}

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'github' | 'google' | 'microsoft';

/**
 * Login credentials for email/password auth
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

/**
 * Session status from BFF
 */
export interface SessionStatus {
  authenticated: boolean;
  user_id?: string;
  expires_at?: string;
}

/**
 * Auth error from BFF
 */
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * AuthProvider configuration
 */
export interface AuthConfig {
  /**
   * Base URL for BFF endpoints (default: "")
   */
  bffBaseUrl?: string;

  /**
   * Path to redirect to when not authenticated (default: "/login")
   */
  loginUrl?: string;

  /**
   * Path to redirect to after successful login (default: "/")
   */
  defaultRedirect?: string;

  /**
   * Callback when session expires
   */
  onSessionExpired?: () => void;

  /**
   * Callback on auth errors
   */
  onAuthError?: (error: AuthError) => void;

  /**
   * Ends SystemAuth's login session after logout, when the BFF names its
   * sign-out page. Default: a form POST there, which navigates away; `null`
   * stays on the page, signed out of the app only.
   */
  endSession?: ((target: SystemAuthSignOut) => void) | null;

  /**
   * Interval to check session validity in ms (default: 60000)
   */
  checkInterval?: number;
}

/**
 * Auth context value
 */
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => void;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

/**
 * Linked accounts context value
 */
export interface LinkedAccountsContextValue {
  linkedAccounts: LinkedAccount[];
  currentAccount: LinkedAccount | null;
  isLinking: boolean;
  error: Error | null;
  linkAccount: (provider: OAuthProvider) => void;
  unlinkAccount: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
}

/**
 * ProtectedRoute props
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role[];
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}
