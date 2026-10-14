import { toSession } from './adapter';
import type { Session, WireSession } from './types';

/** An error from the BFF, with its stable code when it sent one. */
export class SessionError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'SessionError';
    this.status = status;
    this.code = code;
  }
}

/** Options for {@link SessionClient}. */
export interface SessionClientOptions {
  /** Base path of the BFF routes. Default `/bff`. */
  basePath?: string;
  /** Fetch implementation, for tests. Default the global `fetch`. */
  fetch?: typeof fetch;
}

/** Sign-in options. */
export interface SignInOptions {
  /** Where to land after sign-in: a path on this origin. Default the current location. */
  returnTo?: string;
  /** Sign in with this identity provider directly (for example `github`). */
  provider?: string;
}

/**
 * Talks to the relying-party BFF. No credentials pass through it: sign-in is
 * a redirect, and the session is an HTTP-only cookie.
 */
export class SessionClient {
  private readonly base: string;
  private readonly doFetch: typeof fetch;

  constructor(opts: SessionClientOptions = {}) {
    this.base = (opts.basePath ?? '/bff').replace(/\/+$/, '');
    this.doFetch = opts.fetch ?? ((input, init) => fetch(input, init));
  }

  /** Reads the session. An unauthenticated session is a result, not an error. */
  async getSession(): Promise<Session> {
    const res = await this.doFetch(`${this.base}/session`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw await errorFrom(res);
    }
    return toSession((await res.json()) as WireSession);
  }

  /** The URL that starts sign-in. */
  signInUrl(opts: SignInOptions = {}): string {
    const path = opts.provider
      ? `${this.base}/auth/${encodeURIComponent(opts.provider)}`
      : `${this.base}/auth/login`;
    const returnTo = opts.returnTo ?? currentLocation();
    return returnTo ? `${path}?return_to=${encodeURIComponent(returnTo)}` : path;
  }

  /** Ends the session. The BFF requires a same-origin request, which this is. */
  async signOut(): Promise<void> {
    const res = await this.doFetch(`${this.base}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      throw await errorFrom(res);
    }
  }
}

function currentLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

async function errorFrom(res: Response): Promise<SessionError> {
  let code = 'HTTP_' + res.status;
  let message = res.statusText || `request failed with status ${res.status}`;
  try {
    const body = (await res.json()) as { code?: string; message?: string };
    if (body.code) code = body.code;
    if (body.message) message = body.message;
  } catch {
    // The body is not JSON; the status line is all there is.
  }
  return new SessionError(res.status, code, message);
}
