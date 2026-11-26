import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../LoginPage';

const loginWithOAuth = vi.fn();

vi.mock('@plexusone/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@plexusone/auth')>()),
  useAuth: () => ({ login: vi.fn(), loginWithOAuth, isLoading: false, error: null }),
}));

describe('LoginPage sign-in methods', () => {
  beforeEach(() => {
    loginWithOAuth.mockClear();
  });

  it('offers a button for each method, email included, in the order given', () => {
    render(
      <LoginPage
        oauthProviders={['github', 'google', 'email']}
        showEmailForm={false}
        showRegisterLink={false}
      />
    );
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons).toEqual([
      'Continue with GitHub',
      'Continue with Google',
      'Continue with email',
    ]);
  });

  it('signs in with a mailed code when email is chosen', () => {
    render(<LoginPage oauthProviders={['email']} showEmailForm={false} showRegisterLink={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with email' }));
    expect(loginWithOAuth).toHaveBeenCalledExactlyOnceWith('email');
  });

  it('keeps the other providers working', () => {
    render(
      <LoginPage
        oauthProviders={['github', 'email']}
        showEmailForm={false}
        showRegisterLink={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue with GitHub' }));
    expect(loginWithOAuth).toHaveBeenCalledExactlyOnceWith('github');
  });
});
