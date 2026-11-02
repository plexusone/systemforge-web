import { readSignOut, type SystemAuthSignOut } from './signout';
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
      const error = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: response.statusText,
      }));
      throw error as AuthError;
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
    if (returnTo) {
      params.set('return_to', returnTo);
    }
    const query = params.toString();
    return `${this.baseUrl}/bff/auth/${provider}${query ? `?${query}` : ''}`;
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
    window.location.assign(`${this.baseUrl}/bff/auth/link/${provider}`);
  }

  /**
   * Unlink an OAuth account
   */
  async unlinkAccount(accountId: string): Promise<void> {
    await this.request<void>(`/bff/auth/accounts/${accountId}`, {
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
