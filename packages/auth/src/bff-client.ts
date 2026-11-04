import { readSignOut, type SystemAuthSignOut } from './signout';
import { returnPath } from './url';
import type {
  User,
  SessionStatus,
  LoginCredentials,
  RegisterData,
  LinkedAccount,
  AuthError,
  OAuthProvider,
} from './types';

/**
 * BFF client for SystemForge authentication endpoints
 */
export class BFFClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request to the BFF
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Always send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw await authErrorFrom(response);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Get current session status
   */
  async getSession(): Promise<SessionStatus> {
    return this.request<SessionStatus>('/bff/session');
  }

  /**
   * Get current user
   */
  async getUser(): Promise<User> {
    return this.request<User>('/bff/api/v1/users/me');
  }

  /**
   * Login with email/password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await this.request<{ user: User }>('/bff/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.user;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await this.request<{ user: User }>('/bff/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.user;
  }

  /**
   * Logout current session
   */
  async logout(): Promise<SystemAuthSignOut | undefined> {
    const body = await this.request<unknown>('/bff/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    return readSignOut(body);
  }

  /**
   * Get OAuth login URL and redirect
   */
  getOAuthUrl(provider: OAuthProvider, returnTo?: string): string {
    const params = new URLSearchParams();
    const path = returnPath(returnTo);
    if (path) {
      params.set('return_to', path);
    }
    const query = params.toString();
    return `${this.baseUrl}/bff/auth/${encodeURIComponent(provider)}${query ? `?${query}` : ''}`;
  }

  /**
   * Initiate OAuth login (redirects browser)
   */
  loginWithOAuth(provider: OAuthProvider, returnTo?: string): void {
    window.location.assign(this.getOAuthUrl(provider, returnTo));
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request<void>('/bff/api/v1/users/me/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.request<void>('/bff/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.request<void>('/bff/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });
  }

  /**
   * Get linked OAuth accounts
   */
  async getLinkedAccounts(): Promise<LinkedAccount[]> {
    const response = await this.request<{ accounts: LinkedAccount[] }>(
      '/bff/api/v1/users/me/accounts'
    );
    return response.accounts;
  }

  /**
   * Initiate account linking (redirects browser)
   */
  linkAccount(provider: OAuthProvider): void {
    window.location.assign(`${this.baseUrl}/bff/auth/link/${encodeURIComponent(provider)}`);
  }

  /**
   * Unlink an OAuth account
   */
  async unlinkAccount(accountId: string): Promise<void> {
    await this.request<void>(`/bff/auth/accounts/${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Switch to a linked account
   */
  async switchAccount(accountId: string): Promise<User> {
    const response = await this.request<{ user: User }>('/bff/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId }),
    });
    return response.user;
  }
}

/**
 * Default BFF client instance
 */
export const defaultBFFClient = new BFFClient();

/**
 * authErrorFrom reads an error response into an AuthError, whatever its body:
 * JSON with code and message, other JSON, or none at all.
 */
async function authErrorFrom(response: Response): Promise<AuthError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  return {
    code: typeof b.code === 'string' ? b.code : 'UNKNOWN_ERROR',
    message:
      typeof b.message === 'string'
        ? b.message
        : response.statusText || `request failed with status ${response.status}`,
    ...(typeof b.details === 'object' && b.details !== null
      ? { details: b.details as Record<string, unknown> }
      : {}),
    status: response.status,
  };
}

/** isUnauthorized reports whether an error means the session is gone. */
export function isUnauthorized(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Partial<AuthError>;
  return e.status === 401 || e.code === 'UNAUTHORIZED';
}
