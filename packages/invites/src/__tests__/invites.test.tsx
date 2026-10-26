import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInvitesApi, InviteAdminPage, InvitePeoplePage, splitEmails } from '../index';
import type { InviteCode, MyInvites } from '../types';

interface Call {
  method: string;
  url: string;
  body?: unknown;
  credentials?: RequestCredentials;
}

let calls: Call[];
let respond: (c: Call) => Response | undefined;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function code(over: Partial<InviteCode> = {}): InviteCode {
  return {
    id: 'code-1',
    kind: 'member',
    hint: 'WXYZ',
    max_uses: 1,
    use_count: 0,
    status: 'active',
    created_at: '2026-10-01T00:00:00Z',
    expires_at: '2026-10-15T00:00:00Z',
    ...over,
  };
}

function mine(over: Partial<MyInvites> = {}): MyInvites {
  return {
    allowance: 3,
    held: 1,
    remaining: 2,
    member_code_ttl_seconds: 14 * 86400,
    codes: [code()],
    ...over,
  };
}

beforeEach(() => {
  calls = [];
  respond = () => undefined;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = {
      method: init?.method ?? 'GET',
      url: String(input),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      credentials: init?.credentials,
    };
    calls.push(c);
    const custom = respond(c);
    if (custom) return custom;
    if (c.url.endsWith('/me/invites')) return json(200, mine());
    if (c.url.endsWith('/settings'))
      return json(200, {
        default_allowance: 0,
        member_code_ttl_seconds: 14 * 86400,
        signup_url: '',
        is_admin: true,
      });
    return json(404, { error: 'not found' });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const api = createInvitesApi('/invites/api/');

describe('createInvitesApi', () => {
  it('sends cookies, encodes paths and reports API errors', async () => {
    respond = (c) =>
      c.url.includes('/admin/codes')
        ? json(403, { error: 'platform administrators only' })
        : undefined;
    await expect(api.codes({ kind: 'operator', activeOnly: true })).rejects.toMatchObject({
      status: 403,
      message: 'platform administrators only',
    });
    expect(calls[0].url).toBe('/invites/api/admin/codes?kind=operator&status=active');
    expect(calls[0].credentials).toBe('include');

    respond = (c) => (c.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined);
    await api.revokeInvite('a+b@example.com');
    expect(calls[1]).toMatchObject({
      method: 'DELETE',
      url: '/invites/api/admin/invites/a%2Bb%40example.com',
    });

    respond = (c) => (c.method === 'PUT' ? json(200, {}) : undefined);
    await api.setAllowance('ada@example.com', null);
    expect(calls[2].body).toEqual({ email: 'ada@example.com', granted: null, note: '' });
  });

  it('splits pasted addresses', () => {
    expect(splitEmails(' ada@example.com,grace@example.com\n\nlin@example.com; ')).toEqual([
      'ada@example.com',
      'grace@example.com',
      'lin@example.com',
    ]);
  });
});

describe('InvitePeoplePage', () => {
  it('shows the allowance and creates a link shown once', async () => {
    respond = (c) =>
      c.method === 'POST' && c.url.endsWith('/me/codes')
        ? json(201, {
            code: code({ id: 'code-2', hint: 'ABCD' }),
            invite_code: 'AAAA-BBBB-CCCC-ABCD',
            link: 'https://auth.example.com/signup?code=AAAA-BBBB-CCCC-ABCD',
          })
        : undefined;
    render(<InvitePeoplePage api={api} />);
    expect(await screen.findByText(/You can invite 2 more people/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create invite link' }));
    const shown = await screen.findByRole('region', { name: 'New invite' });
    expect(within(shown).getByRole('textbox', { name: 'Invite' })).toHaveValue(
      'https://auth.example.com/signup?code=AAAA-BBBB-CCCC-ABCD'
    );
    expect(within(shown).getByText(/will not be shown again/)).toBeInTheDocument();
  });

  it('keeps a new link on screen when reloading the list fails', async () => {
    let loads = 0;
    respond = (c) => {
      if (c.method === 'GET' && c.url.endsWith('/me/invites')) {
        loads++;
        return loads > 1 ? json(500, { error: 'database unavailable' }) : undefined;
      }
      if (c.method === 'POST' && c.url.endsWith('/me/codes'))
        return json(201, {
          code: code({ id: 'code-2', hint: 'ABCD' }),
          invite_code: 'AAAA-BBBB-CCCC-ABCD',
          link: 'https://auth.example.com/signup?code=AAAA-BBBB-CCCC-ABCD',
        });
      return undefined;
    };
    render(<InvitePeoplePage api={api} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Create invite link' }));
    expect(await screen.findByText(/Could not load your invites/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Invite' })).toHaveValue(
      'https://auth.example.com/signup?code=AAAA-BBBB-CCCC-ABCD'
    );
  });

  it('cannot create a link with none left, and says so', async () => {
    respond = (c) =>
      c.url.endsWith('/me/invites')
        ? json(200, mine({ allowance: 0, held: 0, remaining: 0, codes: [] }))
        : undefined;
    render(<InvitePeoplePage api={api} />);
    expect(await screen.findByText("You don't have invites to give yet.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create invite link' })).toBeDisabled();
  });

  it('asks before revoking an unused link', async () => {
    respond = (c) =>
      c.url.endsWith('/revoke') ? json(200, code({ status: 'revoked' })) : undefined;
    render(<InvitePeoplePage api={api} />);
    const row = await screen.findByRole('listitem', { name: 'Invite …WXYZ' });
    fireEvent.click(within(row).getByRole('button', { name: 'Revoke' }));
    expect(calls.some((c) => c.url.endsWith('/revoke'))).toBe(false);
    fireEvent.click(within(row).getByRole('button', { name: 'Revoke …WXYZ' }));
    await waitFor(() =>
      expect(
        calls.some((c) => c.method === 'POST' && c.url.endsWith('/me/codes/code-1/revoke'))
      ).toBe(true)
    );
  });
});

describe('InviteAdminPage', () => {
  it('creates an operator code and shows it once', async () => {
    respond = (c) => {
      if (c.url.includes('/admin/codes') && c.method === 'GET') return json(200, { codes: [] });
      if (c.url.endsWith('/admin/codes') && c.method === 'POST')
        return json(201, {
          code: code({ kind: 'operator', max_uses: 25, label: 'launch' }),
          invite_code: 'AAAA-BBBB-CCCC-DDDD',
        });
      return undefined;
    };
    render(<InviteAdminPage api={api} />);
    expect(await screen.findByText(/No invite codes yet/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'launch' } });
    fireEvent.change(screen.getByLabelText('People it admits'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create invite code' }));
    await screen.findByRole('region', { name: 'New invite' });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({ label: 'launch', note: '', max_uses: 25, expires_in_days: 14 });
    expect(screen.getByRole('textbox', { name: 'Invite' })).toHaveValue('AAAA-BBBB-CCCC-DDDD');
  });

  it('does not show a new code as copied', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    let made = 0;
    respond = (c) => {
      if (c.url.includes('/admin/codes') && c.method === 'GET') return json(200, { codes: [] });
      if (c.url.endsWith('/admin/codes') && c.method === 'POST') {
        made++;
        return json(201, {
          code: code({ kind: 'operator' }),
          invite_code: `AAAA-BBBB-CCCC-000${made}`,
        });
      }
      return undefined;
    };
    try {
      render(<InviteAdminPage api={api} />);
      await screen.findByText(/No invite codes yet/);
      const create = screen.getByRole('button', { name: 'Create invite code' });
      fireEvent.click(create);
      await screen.findByDisplayValue('AAAA-BBBB-CCCC-0001');
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      expect(await screen.findByText('Copied.')).toBeInTheDocument();
      expect(writeText).toHaveBeenCalledWith('AAAA-BBBB-CCCC-0001');

      fireEvent.click(create);
      await screen.findByDisplayValue('AAAA-BBBB-CCCC-0002');
      expect(screen.queryByText('Copied.')).not.toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('tells a non-administrator they cannot manage invites', async () => {
    respond = (c) =>
      c.url.includes('/admin/') ? json(403, { error: 'platform administrators only' }) : undefined;
    render(<InviteAdminPage api={api} />);
    expect(
      await screen.findByText('Only platform administrators can manage invites.')
    ).toBeInTheDocument();
  });

  it('invites selected people from the waitlist', async () => {
    respond = (c) => {
      if (c.url.endsWith('/admin/codes') || c.url.includes('/admin/codes?'))
        return json(200, { codes: [] });
      if (c.url.endsWith('/admin/waitlist'))
        return json(200, {
          waitlist: [
            {
              email: 'ada@example.com',
              consent_version: '1',
              joined_at: '2026-10-01T00:00:00Z',
              last_submitted_at: '2026-10-01T00:00:00Z',
            },
            {
              email: 'grace@example.com',
              consent_version: '1',
              joined_at: '2026-10-02T00:00:00Z',
              last_submitted_at: '2026-10-02T00:00:00Z',
              invited_at: '2026-10-03T00:00:00Z',
            },
          ],
        });
      if (c.url.endsWith('/admin/waitlist/invite'))
        return json(200, {
          invites: [
            { email: 'ada@example.com', status: 'pending', created_at: '2026-10-04T00:00:00Z' },
          ],
        });
      return undefined;
    };
    render(<InviteAdminPage api={api} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Waitlist' }));
    await screen.findByRole('listitem', { name: 'Waiting ada@example.com' });
    fireEvent.click(screen.getByRole('button', { name: 'Select everyone not yet invited' }));
    fireEvent.click(screen.getByRole('button', { name: 'Invite selected (1)' }));
    expect(await screen.findByText(/Invited 1\./)).toBeInTheDocument();
    expect(calls.find((c) => c.url.endsWith('/admin/waitlist/invite'))?.body).toEqual({
      emails: ['ada@example.com'],
    });
  });

  it('does not invite an address removed after it was selected', async () => {
    const entry = (email: string) => ({
      email,
      consent_version: '1',
      joined_at: '2026-10-01T00:00:00Z',
      last_submitted_at: '2026-10-01T00:00:00Z',
    });
    let removed = false;
    respond = (c) => {
      if (c.url.includes('/admin/codes')) return json(200, { codes: [] });
      if (c.method === 'DELETE') {
        removed = true;
        return new Response(null, { status: 204 });
      }
      if (c.url.endsWith('/admin/waitlist'))
        return json(200, {
          waitlist: removed
            ? [entry('lin@example.com')]
            : [entry('ada@example.com'), entry('lin@example.com')],
        });
      if (c.url.endsWith('/admin/waitlist/invite'))
        return json(200, {
          invites: [
            { email: 'lin@example.com', status: 'pending', created_at: '2026-10-04T00:00:00Z' },
          ],
        });
      return undefined;
    };
    render(<InviteAdminPage api={api} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Waitlist' }));
    const ada = await screen.findByRole('listitem', { name: 'Waiting ada@example.com' });
    fireEvent.click(screen.getByRole('button', { name: 'Select everyone not yet invited' }));
    expect(screen.getByRole('button', { name: 'Invite selected (2)' })).toBeEnabled();
    fireEvent.click(within(ada).getByRole('button', { name: 'Remove' }));
    fireEvent.click(within(ada).getByRole('button', { name: 'Remove ada@example.com' }));
    await waitFor(() =>
      expect(screen.queryByRole('listitem', { name: 'Waiting ada@example.com' })).toBeNull()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Invite selected (1)' }));
    await screen.findByText(/Invited 1\./);
    expect(calls.find((c) => c.url.endsWith('/admin/waitlist/invite'))?.body).toEqual({
      emails: ['lin@example.com'],
    });
  });

  it('sets a member allowance by email', async () => {
    respond = (c) => {
      if (c.url.includes('/admin/codes')) return json(200, { codes: [] });
      if (c.url.endsWith('/admin/allowances') && c.method === 'GET')
        return json(200, { allowances: [] });
      if (c.method === 'PUT')
        return json(200, {
          principal_id: 'p1',
          email: 'ada@example.com',
          granted: 5,
          effective: 5,
          held: 0,
          updated_at: '2026-10-04T00:00:00Z',
        });
      return undefined;
    };
    render(<InviteAdminPage api={api} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Member allowances' }));
    expect(
      await screen.findByText(/Members without an allowance of their own may invite 0 people/)
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Member's email"), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('People they may invite (empty: default)'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set allowance' }));
    await waitFor(() =>
      expect(calls.find((c) => c.method === 'PUT')?.body).toEqual({
        email: 'ada@example.com',
        granted: 5,
        note: '',
      })
    );
  });
});
