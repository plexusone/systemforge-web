import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthProvider';
import { BFFClient, isUnauthorized } from '../bff-client';
import { hasRoleIn } from '../ProtectedRoute';
import type { Membership } from '../types';

const m = (organization_id: string, role: Membership['role']): Membership => ({
  id: `m-${organization_id}`,
  organization_id,
  organization_name: organization_id,
  organization_slug: organization_id,
  role,
  joined_at: '2026-01-01T00:00:00Z',
});

describe('hasRoleIn', () => {
  const two = [m('personal', 'owner'), m('acme', 'member')];

  it('checks the named organization only', () => {
    expect(hasRoleIn(two, ['owner'], 'personal')).toBe(true);
    expect(hasRoleIn(two, ['owner'], 'acme')).toBe(false);
    expect(hasRoleIn(two, ['member'], 'acme')).toBe(true);
    expect(hasRoleIn(two, ['member'], 'other')).toBe(false);
  });

  it('without an organization, checks an only membership and refuses several', () => {
    expect(hasRoleIn([m('acme', 'admin')], ['admin'])).toBe(true);
    expect(hasRoleIn(two, ['owner'])).toBe(false);
  });

  it('lets platform admins through', () => {
    expect(hasRoleIn([m('x', 'platform_admin'), m('acme', 'member')], ['owner'], 'acme')).toBe(
      true
    );
  });
});

describe('BFFClient errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads any error body into an AuthError with the status', async () => {
    for (const body of ['null', '"x"', '{"error":"unauthorized"}', '<html>']) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(body, { status: 401, statusText: 'Unauthorized' }))
      );
      const err = await new BFFClient().getUser().catch((e: unknown) => e);
      expect(err).toMatchObject({ code: 'UNKNOWN_ERROR', message: 'Unauthorized', status: 401 });
      expect(isUnauthorized(err)).toBe(true);
    }
  });

  it('encodes IDs in paths', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    await new BFFClient().unlinkAccount('../../api/v1/users/me');
    expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe(
      '/bff/auth/accounts/..%2F..%2Fapi%2Fv1%2Fusers%2Fme'
    );
  });
});

function Who() {
  const { user, error, logout } = useAuth();
  return (
    <>
      <p>{user ? `signed in as ${user.id}` : 'signed out'}</p>
      {error && <p role="alert">{error.message}</p>}
      <button onClick={() => void logout()}>Sign out</button>
    </>
  );
}

describe('AuthProvider logout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function serve(logout: () => Response) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/bff/auth/logout')) return logout();
        if (url.endsWith('/users/me'))
          return new Response(JSON.stringify({ id: 'u1', memberships: [] }), { status: 200 });
        return new Response(JSON.stringify({ authenticated: true }), { status: 200 });
      })
    );
  }

  it('keeps the person signed in and reports it when the server does not sign out', async () => {
    serve(() => new Response('{"message":"origin not allowed"}', { status: 403 }));
    render(
      <AuthProvider checkInterval={0} endSession={null}>
        <Who />
      </AuthProvider>
    );
    await screen.findByText('signed in as u1');
    await act(async () => screen.getByRole('button', { name: 'Sign out' }).click());
    expect((await screen.findByRole('alert')).textContent).toBe('origin not allowed');
    expect(screen.getByText('signed in as u1')).toBeTruthy();
  });

  it('shows the person signed out when the session had already ended', async () => {
    serve(() => new Response(null, { status: 401 }));
    render(
      <AuthProvider checkInterval={0} endSession={null}>
        <Who />
      </AuthProvider>
    );
    await screen.findByText('signed in as u1');
    await act(async () => screen.getByRole('button', { name: 'Sign out' }).click());
    await waitFor(() => expect(screen.getByText('signed out')).toBeTruthy());
  });
});
