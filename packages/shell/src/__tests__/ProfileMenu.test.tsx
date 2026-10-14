import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionClient, SessionProvider, type WireSession } from '@plexusone/auth';
import { Navbar } from '../Navbar';
import { ProfileMenu, initials } from '../ProfileMenu';
import { WithSession, wire } from './session';

async function openMenu(name: RegExp) {
  const trigger = await screen.findByRole('button', { name });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'Enter' });
  return screen.findByRole('menu');
}

/** A session that records requests and answers sign-out with the given status. */
function recording(session: WireSession, logoutStatus = 204) {
  const calls: Array<{ url: string; method: string }> = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? 'GET' });
    if (url.endsWith('/auth/logout')) {
      return new Response(logoutStatus === 204 ? null : JSON.stringify({ code: 'CSRF_REJECTED' }), {
        status: logoutStatus,
      });
    }
    return new Response(JSON.stringify(session), { status: 200 });
  }) as typeof fetch;
  return { client: new SessionClient({ fetch: fetchFn }), calls };
}

describe('initials', () => {
  it('takes two initials from a name or email, one from a single word', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('grace.hopper@example.com')).toBe('GH');
    expect(initials('ada')).toBe('A');
    expect(initials(undefined)).toBe('?');
  });
});

describe('ProfileMenu', () => {
  it('shows who is signed in, the organization and the role in this application', async () => {
    render(
      <WithSession>
        <ProfileMenu appId="agents" organizationId="org-1" />
      </WithSession>
    );
    const menu = await openMenu(/Account: Ada/);
    expect(menu).toHaveTextContent('Ada');
    expect(menu).toHaveTextContent('ada@example.com');
    expect(menu).toHaveTextContent('Acme');
    expect(menu).toHaveTextContent('viewer');
  });

  it('falls back to the organization role without a role in this application', async () => {
    render(
      <WithSession>
        <ProfileMenu appId="portfolio" organizationId="org-1" />
      </WithSession>
    );
    expect(await openMenu(/Account: Ada/)).toHaveTextContent('owner');
  });

  it('has no entries of its own besides sign-out', async () => {
    render(
      <WithSession>
        <ProfileMenu />
      </WithSession>
    );
    await openMenu(/Account: Ada/);
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Sign out']);
  });

  it('runs the application’s entries', async () => {
    const onNavigate = vi.fn();
    const onClick = vi.fn();
    render(
      <WithSession>
        <ProfileMenu
          onNavigate={onNavigate}
          items={[
            { id: 'keys', label: 'API keys', href: '/keys' },
            { id: 'help', label: 'Help', onClick },
          ]}
        />
      </WithSession>
    );
    await openMenu(/Account: Ada/);
    fireEvent.click(screen.getByRole('menuitem', { name: 'API keys' }));
    expect(onNavigate).toHaveBeenCalledWith('/keys');
    await openMenu(/Account: Ada/);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Help' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('signs out through the BFF', async () => {
    const { client, calls } = recording(wire);
    render(
      <SessionProvider client={client} refreshInterval={0} refreshOnFocus={false}>
        <ProfileMenu />
      </SessionProvider>
    );
    await openMenu(/Account: Ada/);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    await waitFor(() => expect(calls).toContainEqual({ url: '/bff/auth/logout', method: 'POST' }));
  });

  it('reports a failed sign-out', async () => {
    const { client } = recording(wire, 403);
    const onSignOutError = vi.fn();
    render(
      <SessionProvider client={client} refreshInterval={0} refreshOnFocus={false}>
        <ProfileMenu onSignOutError={onSignOutError} />
      </SessionProvider>
    );
    await openMenu(/Account: Ada/);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    await waitFor(() => expect(onSignOutError).toHaveBeenCalled());
  });

  it('renders nothing when signed out or outside a session', async () => {
    const { container } = render(<ProfileMenu />);
    expect(container).toBeEmptyDOMElement();
    render(
      <WithSession session={{ authenticated: false }}>
        <ProfileMenu />
      </WithSession>
    );
    await waitFor(() => expect(screen.queryByRole('button', { name: /Account/ })).toBeNull());
  });
});

describe('Navbar profile menu', () => {
  it('uses the session’s profile menu under SessionProvider, with the application’s role', async () => {
    render(
      <WithSession>
        <Navbar
          app={{ id: 'build', name: 'Build', url: '/' }}
          organizationId="org-2"
          profileItems={[{ id: 'k', label: 'Keys', href: '/k' }]}
        />
      </WithSession>
    );
    const menu = await openMenu(/Account: Ada/);
    expect(menu).toHaveTextContent('editor');
    expect(screen.getByRole('menuitem', { name: 'Keys' })).toBeInTheDocument();
  });
});
