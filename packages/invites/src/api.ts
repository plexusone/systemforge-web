import type {
  Allowance,
  CodeKind,
  CodeOptions,
  CreatedCode,
  EmailInvite,
  InviteCode,
  InviteOptions,
  InviteSettings,
  JoinedAccount,
  MyInvites,
  WaitlistEntry,
} from './types';

/** An error from the invite API, with its HTTP status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** The invite API. Every call runs as the signed-in person. */
export interface InvitesApi {
  settings(): Promise<InviteSettings>;

  /** The caller's allowance and codes. */
  myInvites(): Promise<MyInvites>;
  /** Creates a single-use code for the caller; fails with 409 when none are left. */
  createMyCode(): Promise<CreatedCode>;
  revokeMyCode(id: string): Promise<InviteCode>;

  // Platform administrators only.
  invites(all?: boolean): Promise<EmailInvite[]>;
  addInvites(
    emails: string[],
    options?: InviteOptions
  ): Promise<{ invites: EmailInvite[]; failed: { email: string; error: string }[] }>;
  revokeInvite(email: string): Promise<void>;
  codes(filter?: { kind?: CodeKind; label?: string; activeOnly?: boolean }): Promise<InviteCode[]>;
  createCode(options: CodeOptions): Promise<CreatedCode>;
  revokeCode(id: string): Promise<InviteCode>;
  waitlist(): Promise<WaitlistEntry[]>;
  inviteFromWaitlist(
    emails: string[],
    options?: InviteOptions
  ): Promise<{ invites: EmailInvite[]; error?: string }>;
  removeFromWaitlist(email: string): Promise<void>;
  allowances(): Promise<Allowance[]>;
  /** Sets a member's allowance by email; null returns them to the default. */
  setAllowance(email: string, granted: number | null, note?: string): Promise<Allowance>;
  joined(filter?: { codeId?: string; label?: string; inviter?: string }): Promise<JoinedAccount[]>;
}

function query(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * createInvitesApi returns a client for the invite API served at baseUrl,
 * such as '/invites/api' behind the host's own session or
 * 'https://auth.example.com/signup-invites/api' on SystemAuth. Requests
 * carry the browser's cookies.
 */
export function createInvitesApi(baseUrl: string): InvitesApi {
  const base = baseUrl.replace(/\/+$/, '');

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok) {
      let message = res.statusText || `request failed with status ${res.status}`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // Not JSON; the status line is the message.
      }
      throw new ApiError(res.status, message);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
  const post = <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const enc = encodeURIComponent;

  return {
    settings: () => request<InviteSettings>('/settings'),
    myInvites: () => request<MyInvites>('/me/invites'),
    createMyCode: () => post<CreatedCode>('/me/codes'),
    revokeMyCode: (id) => post<InviteCode>(`/me/codes/${enc(id)}/revoke`),

    invites: (all) =>
      request<{ invites: EmailInvite[] }>(`/admin/invites${all ? '?status=all' : ''}`).then(
        (r) => r.invites
      ),
    addInvites: (emails, options) => post('/admin/invites', { emails, ...options }),
    revokeInvite: (email) => request<void>(`/admin/invites/${enc(email)}`, { method: 'DELETE' }),
    codes: (f) =>
      request<{ codes: InviteCode[] }>(
        `/admin/codes${query({ kind: f?.kind, label: f?.label, status: f?.activeOnly ? 'active' : undefined })}`
      ).then((r) => r.codes),
    createCode: (options) => post<CreatedCode>('/admin/codes', options),
    revokeCode: (id) => post<InviteCode>(`/admin/codes/${enc(id)}/revoke`),
    waitlist: () =>
      request<{ waitlist: WaitlistEntry[] }>('/admin/waitlist').then((r) => r.waitlist),
    inviteFromWaitlist: (emails, options) => post('/admin/waitlist/invite', { emails, ...options }),
    removeFromWaitlist: (email) =>
      request<void>(`/admin/waitlist/${enc(email)}`, { method: 'DELETE' }),
    allowances: () =>
      request<{ allowances: Allowance[] }>('/admin/allowances').then((r) => r.allowances),
    setAllowance: (email, granted, note) =>
      request<Allowance>('/admin/allowances', {
        method: 'PUT',
        body: JSON.stringify({ email, granted, note: note ?? '' }),
      }),
    joined: (f) =>
      request<{ joined: JoinedAccount[] }>(
        `/admin/joined${query({ code_id: f?.codeId, label: f?.label, inviter: f?.inviter })}`
      ).then((r) => r.joined),
  };
}
