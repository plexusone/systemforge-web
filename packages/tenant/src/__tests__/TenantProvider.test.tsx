import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  value: { user: null as unknown, isLoading: true },
}));

vi.mock('@plexusone/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@plexusone/auth')>()),
  useAuth: () => auth.value,
}));

import { ORG_CHANGE_EVENT, TenantProvider, useTenant } from '../TenantProvider';

const user = (id: string) => ({
  id,
  memberships: [
    {
      id: 'm1',
      organization_id: 'org-1',
      organization_name: 'One',
      organization_slug: 'one',
      role: 'owner',
      joined_at: '',
    },
    {
      id: 'm2',
      organization_id: 'org-2',
      organization_name: 'Two',
      organization_slug: 'two',
      role: 'member',
      joined_at: '',
    },
  ],
});

function Current() {
  const { currentOrg } = useTenant();
  return <p>{currentOrg ? currentOrg.id : 'none'}</p>;
}

describe('TenantProvider', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    auth.value = { user: null, isLoading: true };
  });

  it('keeps the stored organization across a page load', () => {
    localStorage.setItem('systemforge:current_org', 'org-2');
    const { rerender } = render(
      <TenantProvider>
        <Current />
      </TenantProvider>
    );
    auth.value = { user: user('u1'), isLoading: false };
    rerender(
      <TenantProvider>
        <Current />
      </TenantProvider>
    );
    expect(screen.getByText('org-2')).toBeTruthy();
    expect(localStorage.getItem('systemforge:current_org')).toBe('org-2');
  });

  it('forgets the stored organization when the person signs out', () => {
    localStorage.setItem('systemforge:current_org', 'org-2');
    auth.value = { user: user('u1'), isLoading: false };
    const { rerender } = render(
      <TenantProvider>
        <Current />
      </TenantProvider>
    );
    auth.value = { user: null, isLoading: false };
    rerender(
      <TenantProvider>
        <Current />
      </TenantProvider>
    );
    expect(localStorage.getItem('systemforge:current_org')).toBeNull();
  });

  it('announces the first organization in use', () => {
    const seen = vi.fn();
    const listen = (e: Event) => seen((e as CustomEvent).detail.org.id);
    window.addEventListener(ORG_CHANGE_EVENT, listen);
    auth.value = { user: user('u1'), isLoading: false };
    render(
      <TenantProvider>
        <Current />
      </TenantProvider>
    );
    window.removeEventListener(ORG_CHANGE_EVENT, listen);
    expect(seen).toHaveBeenCalledWith('org-1');
  });

  it('works when storage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    auth.value = { user: user('u1'), isLoading: false };
    render(
      <TenantProvider>
        <Current />
      </TenantProvider>
    );
    expect(screen.getByText('org-1')).toBeTruthy();
  });
});
