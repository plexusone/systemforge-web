import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionClient } from '../client';
import { SessionProvider, useSession } from '../SessionProvider';
import { fakeFetch, json, signedOut, twoOrgs } from './fixtures';

function Probe() {
  const { status, session, signIn, signOut } = useSession();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="who">{session.user?.name ?? '-'}</span>
      <button onClick={() => signIn({ returnTo: '/x', provider: 'github' })}>in</button>
      <button onClick={() => void signOut()}>out</button>
    </div>
  );
}

function sequence(...bodies: unknown[]) {
  let i = 0;
  return () => json(bodies[Math.min(i++, bodies.length - 1)]);
}

describe('SessionProvider', () => {
  it('reads the session on mount', async () => {
    const f = fakeFetch({ '/bff/session': () => json(twoOrgs) });
    render(
      <SessionProvider client={new SessionClient({ fetch: f.fn })} refreshInterval={0}>
        <Probe />
      </SessionProvider>
    );
    expect(screen.getByTestId('status').textContent).toBe('loading');
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'));
    expect(screen.getByTestId('who').textContent).toBe('Ada');
  });

  it('reports an error status when the BFF fails', async () => {
    const f = fakeFetch({ '/bff/session': () => json({ code: 'INTERNAL_ERROR' }, 500) });
    render(
      <SessionProvider client={new SessionClient({ fetch: f.fn })} refreshInterval={0}>
        <Probe />
      </SessionProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'));
  });

  it('re-reads on focus and calls onUnauthorized when the session ends', async () => {
    const f = fakeFetch({ '/bff/session': sequence(twoOrgs, signedOut) });
    const onUnauthorized = vi.fn();
    render(
      <SessionProvider
        client={new SessionClient({ fetch: f.fn })}
        refreshInterval={0}
        onUnauthorized={onUnauthorized}
      >
        <Probe />
      </SessionProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'));
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnauthorized for a deliberate sign-out', async () => {
    const f = fakeFetch({
      '/bff/session': sequence(twoOrgs, signedOut),
      '/bff/auth/logout': () => new Response(null, { status: 204 }),
    });
    const onUnauthorized = vi.fn();
    render(
      <SessionProvider
        client={new SessionClient({ fetch: f.fn })}
        refreshInterval={0}
        onUnauthorized={onUnauthorized}
      >
        <Probe />
      </SessionProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'));
    await act(async () => {
      screen.getByText('out').click();
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('signs in by navigating to the BFF', async () => {
    const f = fakeFetch({ '/bff/session': () => json(signedOut) });
    const navigate = vi.fn();
    render(
      <SessionProvider
        client={new SessionClient({ fetch: f.fn })}
        refreshInterval={0}
        navigate={navigate}
      >
        <Probe />
      </SessionProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    screen.getByText('in').click();
    expect(navigate).toHaveBeenCalledWith('/bff/auth/github?return_to=%2Fx');
  });

  it('refuses use outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useSession must be used within a SessionProvider');
    spy.mockRestore();
  });
});
