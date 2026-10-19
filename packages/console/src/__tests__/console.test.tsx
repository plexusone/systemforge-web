import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devSession } from '@plexusone/host';
import { conformanceProblems, renderApp } from '@plexusone/host/testing';
import { consoleApp } from '../app';
import { withConnection } from '../pages/Connect';
import { expiryText } from '../components/ui';
import type { Connection, Manifest } from '../types';

const cloudflare: Manifest = {
  key: 'cloudflare',
  displayName: 'Cloudflare',
  baseUrls: ['https://api.cloudflare.com'],
  authMethods: [
    {
      key: 'api_token',
      fields: [{ name: 'token', label: 'API token', secret: true, required: true }],
      scopes: [
        { name: 'Zone:Read', description: 'List zones', required: true },
        { name: 'Analytics:Read', description: 'Traffic and security analytics' },
      ],
      setup: [
        { title: 'Open the token form', url: 'https://dash.cloudflare.com/profile/api-tokens?x=1' },
        { title: 'Set it to expire', detail: 'Choose 90 days.', rotation: ['manual'] },
        { title: 'Let it roll itself', rotation: ['automatic'] },
      ],
      rotation: [
        {
          key: 'automatic',
          label: 'Rotate it for me',
          scopes: [{ name: 'API Tokens:Edit', required: true }],
          risks: ['It can create other tokens.'],
        },
        { key: 'manual', label: 'Rotate it myself', expiryDays: 90, recommended: true },
      ],
    },
  ],
};

const github: Manifest = {
  key: 'github',
  displayName: 'GitHub',
  baseUrls: ['https://api.github.com'],
  authMethods: [
    { key: 'api_token', fields: [{ name: 'token', label: 'Token', secret: true, required: true }] },
  ],
};

const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

function connection(over: Partial<Connection> = {}): Connection {
  return {
    id: 'c1',
    provider: 'cloudflare',
    authMethod: 'api_token',
    displayName: 'Cloudflare',
    externalLabel: 'Acme Corp',
    state: 'connected',
    health: { lastValidation: 'ok', credentialExpiresAt: soon },
    metadata: { rotation: 'manual' },
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...over,
  };
}

interface Call {
  method: string;
  url: string;
  body?: unknown;
}

let calls: Call[];
let respond: (c: Call) => Response | undefined;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  calls = [];
  respond = () => undefined;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = {
      method: init?.method ?? 'GET',
      url: String(input),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(c);
    const custom = respond(c);
    if (custom) return custom;
    if (c.url.endsWith('/v1/providers')) return json(200, { providers: [cloudflare, github] });
    if (c.url.endsWith('/connections') && c.method === 'GET')
      return json(200, { connections: [connection()] });
    return json(404, { error: 'not found' });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const session = (role: string) =>
  devSession(consoleApp, { organizations: [{ id: 'org-1', name: 'Acme', role }] });

describe('consoleApp', () => {
  it('is hostable', () => {
    expect(conformanceProblems(consoleApp)).toEqual([]);
  });
});

describe('Connections', () => {
  it('lists connections with their account, rotation and expiry', async () => {
    renderApp(consoleApp, { session: session('admin'), path: '/orgs/org-1/connections' });
    const row = await screen.findByRole('article', { name: 'Cloudflare' });
    expect(within(row).getByText('Connected')).toBeInTheDocument();
    expect(within(row).getByText(/Acme Corp/)).toHaveTextContent('rotated by hand');
    expect(within(row).getByText(/Expires in 4 days|Expires in 5 days/)).toHaveTextContent(
      'replace the token before then'
    );
    expect(screen.getByRole('link', { name: 'Connect a service' })).toHaveAttribute(
      'href',
      '/orgs/org-1/connections/new'
    );
  });

  it('opens the connections from the organization home', async () => {
    renderApp(consoleApp, { session: session('admin'), path: '/orgs/org-1' });
    expect(await screen.findByRole('article', { name: 'Cloudflare' })).toBeInTheDocument();
  });

  it('lets a member test but not manage', async () => {
    renderApp(consoleApp, { session: session('member'), path: '/orgs/org-1/connections' });
    const row = await screen.findByRole('article', { name: 'Cloudflare' });
    expect(within(row).getByRole('button', { name: 'Test' })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Replace token' })).toBeNull();
    expect(within(row).queryByRole('button', { name: 'Disconnect' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Connect a service' })).toBeNull();
  });

  it('replaces a token, then reloads', async () => {
    respond = (c) => (c.url.endsWith('/reconnect') ? json(200, connection()) : undefined);
    renderApp(consoleApp, { session: session('admin'), path: '/orgs/org-1/connections' });
    const row = await screen.findByRole('article', { name: 'Cloudflare' });
    fireEvent.click(within(row).getByRole('button', { name: 'Replace token' }));
    fireEvent.change(within(row).getByLabelText('API token'), { target: { value: 'new-token' } });
    fireEvent.click(within(row).getAllByRole('button', { name: 'Replace token' })[1]);
    await within(row).findByText('The new token is in use.');
    const post = calls.find((c) => c.url.endsWith('/connections/c1/reconnect'));
    expect(post).toMatchObject({ method: 'POST', body: { fields: { token: 'new-token' } } });
  });

  it('asks before disconnecting', async () => {
    respond = (c) =>
      c.method === 'DELETE' ? json(200, connection({ state: 'disconnected' })) : undefined;
    renderApp(consoleApp, { session: session('owner'), path: '/orgs/org-1/connections' });
    const row = await screen.findByRole('article', { name: 'Cloudflare' });
    fireEvent.click(within(row).getByRole('button', { name: 'Disconnect' }));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    fireEvent.click(within(row).getByRole('button', { name: 'Disconnect Cloudflare' }));
    await waitFor(() =>
      expect(calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/connections/c1'))).toBe(
        true
      )
    );
  });

  it('says when connections are not enabled', async () => {
    respond = (c) =>
      c.url.endsWith('/connections') ? json(404, { error: 'not found' }) : undefined;
    renderApp(consoleApp, { session: session('admin'), path: '/orgs/org-1/connections' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Connections are not enabled');
  });
});

describe('Gallery', () => {
  it('offers each service, keeping the return address', async () => {
    renderApp(consoleApp, {
      session: session('admin'),
      path: '/orgs/org-1/connections/new?return_to=https%3A%2F%2Fapp.example.com%2Fsites%2Fnew',
    });
    const card = await screen.findByRole('link', { name: /Cloudflare/ });
    expect(card).toHaveTextContent('Guided setup · 2 permissions');
    expect(card).toHaveTextContent('1 connected');
    expect(card).toHaveAttribute(
      'href',
      '/orgs/org-1/connections/new/cloudflare?return_to=https%3A%2F%2Fapp.example.com%2Fsites%2Fnew'
    );
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveTextContent('Not connected');
  });

  it('tells a member to ask an admin', async () => {
    renderApp(consoleApp, { session: session('member'), path: '/orgs/org-1/connections/new' });
    expect(
      await screen.findByText(/Only an organization’s owners and admins connect services/)
    ).toBeInTheDocument();
  });
});

describe('Connect', () => {
  it('guides a manual connection step by step and connects', async () => {
    respond = (c) =>
      c.method === 'POST' && c.url.endsWith('/connections')
        ? json(201, connection({ displayName: 'Cloudflare prod' }))
        : undefined;
    renderApp(consoleApp, {
      session: session('admin'),
      path: '/orgs/org-1/connections/new/cloudflare',
    });

    // Manual is recommended and chosen first; its steps and permissions show.
    const manual = await screen.findByRole('radio', { name: /Rotate it myself/ });
    expect(manual).toBeChecked();
    expect(screen.getByText('Set it to expire')).toBeInTheDocument();
    expect(screen.queryByText('Let it roll itself')).toBeNull();
    expect(screen.getByRole('link', { name: /Open dash\.cloudflare\.com/ })).toHaveAttribute(
      'target',
      '_blank'
    );
    const perms = screen.getByRole('table', { name: 'Permissions to grant' });
    expect(within(perms).getByText('Zone:Read')).toBeInTheDocument();
    expect(within(perms).queryByText('API Tokens:Edit')).toBeNull();
    expect(screen.getByText(/expiry 90 days out/)).toBeInTheDocument();

    // Automatic adds its permission and shows its trade-off.
    fireEvent.click(screen.getByRole('radio', { name: /Rotate it for me/ }));
    expect(screen.getByText('Let it roll itself')).toBeInTheDocument();
    expect(within(perms).getByText('API Tokens:Edit')).toBeInTheDocument();
    expect(screen.getByText(/It can create other tokens/)).toBeInTheDocument();
    fireEvent.click(manual);

    // Paste the token and connect.
    const token = screen.getByLabelText('API token');
    expect(token).toHaveAttribute('type', 'password');
    fireEvent.change(token, { target: { value: 'cf-token' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Cloudflare prod' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Cloudflare' }));

    expect(
      await screen.findByRole('heading', { name: 'Cloudflare is connected' })
    ).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST');
    expect(post).toMatchObject({
      url: '/console/api/v1/organizations/org-1/connections',
      body: {
        provider: 'cloudflare',
        authMethod: 'api_token',
        displayName: 'Cloudflare prod',
        fields: { token: 'cf-token' },
        rotation: 'manual',
      },
    });
    // The token is gone from the page once connected.
    expect(screen.queryByDisplayValue('cf-token')).toBeNull();
  });

  it('explains a token the service rejected', async () => {
    respond = (c) =>
      c.method === 'POST'
        ? json(422, { error: 'the provider rejected the credential' })
        : undefined;
    renderApp(consoleApp, {
      session: session('admin'),
      path: '/orgs/org-1/connections/new/cloudflare',
    });
    fireEvent.change(await screen.findByLabelText('API token'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Cloudflare' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cloudflare did not accept the token'
    );
  });

  it('returns to the application that sent the person, once allowed', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    respond = (c) => {
      if (c.method === 'POST') return json(201, connection());
      if (c.url.includes('/v1/return-to'))
        return json(200, { url: 'https://app.example.com/sites/new' });
      return undefined;
    };
    renderApp(consoleApp, {
      session: session('admin'),
      path: '/orgs/org-1/connections/new/github?return_to=https%3A%2F%2Fapp.example.com%2Fsites%2Fnew',
    });
    // A service without guidance still connects, with a plain form.
    fireEvent.change(await screen.findByLabelText('Token'), { target: { value: 'gh-token' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://app.example.com/sites/new?connection_id=c1')
    );
  });

  it('names a service the deployment does not offer', async () => {
    renderApp(consoleApp, { session: session('admin'), path: '/orgs/org-1/connections/new/nope' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'does not offer a service named “nope”'
    );
  });
});

describe('expiryText', () => {
  const now = new Date('2026-10-19T00:00:00Z');
  it('reads expiry, and flags the last two weeks', () => {
    expect(expiryText(connection({ health: {} }), now)).toEqual({
      text: 'Does not expire',
      soon: false,
    });
    expect(
      expiryText(connection({ health: { credentialExpiresAt: '2027-01-17T00:00:00Z' } }), now).soon
    ).toBe(false);
    expect(
      expiryText(connection({ health: { credentialExpiresAt: '2026-10-25T00:00:00Z' } }), now)
    ).toMatchObject({
      text: expect.stringMatching(/^Expires in 6 days/),
      soon: true,
    });
    expect(
      expiryText(connection({ health: { credentialExpiresAt: '2026-10-01T00:00:00Z' } }), now)
    ).toMatchObject({
      text: expect.stringMatching(/^Expired on/),
      soon: true,
    });
  });
});

describe('withConnection', () => {
  it('adds the connection to an absolute or relative return address', () => {
    expect(withConnection('https://app.example.com/sites/new?tab=cf#top', 'c 1')).toBe(
      'https://app.example.com/sites/new?tab=cf&connection_id=c+1#top'
    );
    expect(withConnection('/console/orgs/x', 'c1')).toBe('/console/orgs/x?connection_id=c1');
  });
});
