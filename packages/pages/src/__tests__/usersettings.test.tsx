import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserSettingsPage } from '../UserSettingsPage';

const account = (id: string, provider: string) => ({
  id,
  provider,
  provider_user_id: `${provider}-1`,
  email: `${provider}@example.com`,
  linked_at: '2026-01-01T00:00:00Z',
});

const user = { id: 'u-1', name: 'jane@example.com', email: 'jane@example.com' };

vi.mock('@plexusone/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@plexusone/auth')>()),
  useAuth: () => ({ user }),
  useLinkedAccounts: () => ({
    // `email` is a sign-in method the page has no name or icon for.
    linkedAccounts: [account('1', 'github'), account('2', 'email')],
    linkAccount: vi.fn(),
    unlinkAccount: vi.fn(),
    isLinking: false,
  }),
}));

describe('UserSettingsPage linked accounts', () => {
  it('names a sign-in method it does not know by its own name', () => {
    render(<UserSettingsPage activeTab="accounts" tabs={['accounts']} />);
    expect(screen.getByText('GitHub')).toBeTruthy();
    // Not blank, and not a crash.
    expect(screen.getByText('email')).toBeTruthy();
    expect(screen.getByText('email@example.com')).toBeTruthy();
  });
});

describe('UserSettingsPage profile', () => {
  it('starts the name empty and required when the stored name is an address', () => {
    render(<UserSettingsPage activeTab="profile" tabs={['profile']} onSaveProfile={vi.fn()} />);
    const name = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(name.value).toBe('');
    expect(name.required).toBe(true);
  });
});
