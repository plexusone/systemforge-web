import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../LoginPage';

const loginWithOAuth = vi.fn();
const navigate = vi.fn();
const auth = { bffBaseUrl: '' };

vi.mock('@plexusone/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@plexusone/auth')>()),
  navigateTo: (href: string) => navigate(href),
  useAuth: () => ({
    login: vi.fn(),
    loginWithOAuth,
    isLoading: false,
    error: null,
    bffBaseUrl: auth.bffBaseUrl,
  }),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const method = (id: string, name: string) => ({ id, name, path: `/bff/auth/${id}` });

const names = () => screen.queryAllByRole('button').map((b) => b.textContent);

describe('LoginPage with the deployment’s sign-in methods', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    loginWithOAuth.mockClear();
    navigate.mockClear();
    fetchMock.mockReset();
    auth.bffBaseUrl = '';
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers what the BFF lists, in its order, when no list is given', async () => {
    fetchMock.mockResolvedValue(
      json({ methods: [method('email', 'Email'), method('github', 'GitHub')] })
    );
    render(<LoginPage showEmailForm={false} showRegisterLink={false} />);
    await waitFor(() => expect(names()).toEqual(['Continue with email', 'Continue with GitHub']));
    fireEvent.click(screen.getByRole('button', { name: 'Continue with email' }));
    expect(loginWithOAuth).toHaveBeenCalledExactlyOnceWith('email');
    expect(fetchMock.mock.calls[0][0]).toBe('/bff/auth/methods');
    // Asking for JSON keeps a refusal from redirecting to a sign-in page.
    expect(fetchMock.mock.calls[0][1].headers.Accept).toBe('application/json');
  });

  it('asks the BFF the provider is configured with', async () => {
    auth.bffBaseUrl = 'https://app.example.com';
    fetchMock.mockResolvedValue(json({ methods: [method('google', 'Google')] }));
    render(<LoginPage showEmailForm={false} showRegisterLink={false} />);
    await screen.findByRole('button', { name: 'Continue with Google' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://app.example.com/bff/auth/methods');
  });

  it('makes no request when the page lists its own methods', () => {
    render(<LoginPage oauthProviders={['github']} showEmailForm={false} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeTruthy();
  });

  it('shows no buttons and makes no request for an empty list', () => {
    render(<LoginPage oauthProviders={[]} showEmailForm={false} showRegisterLink={false} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(names()).toEqual([]);
  });

  it('leaves out a method it has no label for', async () => {
    fetchMock.mockResolvedValue(
      json({
        methods: [
          method('carrier-pigeon', 'Pigeon'),
          method('toString', 'x'),
          method('email', 'Email'),
        ],
      })
    );
    render(<LoginPage showEmailForm={false} showRegisterLink={false} />);
    await waitFor(() => expect(names()).toEqual(['Continue with email']));
  });

  it.each([
    ['an older server', () => json({ code: 'UNKNOWN_PROVIDER', message: 'unknown' }, 404)],
    ['a server that publishes none', () => json({ methods: [] })],
  ])('still lets a person sign in against %s', async (_name, response) => {
    fetchMock.mockImplementation(async () => response());
    render(<LoginPage showEmailForm={false} showRegisterLink={false} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Continue to sign in' }));
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/bff/auth/login');
  });

  it('adds no extra button beside a password form', async () => {
    fetchMock.mockResolvedValue(json({ methods: [] }));
    render(<LoginPage showRegisterLink={false} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole('button', { name: 'Continue to sign in' })).toBeNull();
  });
});
