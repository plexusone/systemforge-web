import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { orgUrl } from '../api';
import { OrganizationMembersPage } from '../OrganizationMembersPage';

describe('orgUrl', () => {
  it('encodes every segment', () => {
    expect(orgUrl('/api', 'acme')).toBe('/api/organizations/acme');
    expect(orgUrl('/api', '../../admin/x?', 'members', 'a/b')).toBe(
      '/api/organizations/..%2F..%2Fadmin%2Fx%3F/members/a%2Fb'
    );
  });
});

describe('OrganizationMembersPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const member = (org: string) => ({
    id: `m-${org}`,
    principal_id: `p-${org}`,
    role: 'member',
    joined_at: '2026-01-01T00:00:00Z',
    user: { id: `p-${org}`, name: `Person in ${org}`, email: `${org}@example.com` },
  });

  it('loads the members of a new organization when orgSlug changes', async () => {
    const fetch = vi.fn(async (url: string) => {
      const org = url.split('/organizations/')[1].split('/')[0];
      return new Response(JSON.stringify({ members: [member(org)] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetch);
    const { rerender } = render(
      <OrganizationMembersPage orgSlug="org-a" currentUserId="u" apiBaseUrl="/api" />
    );
    await screen.findByText('Person in org-a');
    rerender(<OrganizationMembersPage orgSlug="org-b" currentUserId="u" apiBaseUrl="/api" />);
    await screen.findByText('Person in org-b');
    expect(screen.queryByText('Person in org-a')).toBeNull();
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/organizations/org-b/members', expect.anything())
    );
  });

  it('offers an admin no controls over another admin, and owners full control', async () => {
    const people = [
      { ...member('a2'), principal_id: 'p-a2', role: 'admin' },
      { ...member('m1'), principal_id: 'p-m1', role: 'member' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ members: people }), { status: 200 }))
    );
    const { unmount } = render(
      <OrganizationMembersPage
        orgSlug="acme"
        currentUserId="u"
        currentUserRole="admin"
        apiBaseUrl="/api"
      />
    );
    await screen.findByText('Person in a2');
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    unmount();
    render(
      <OrganizationMembersPage
        orgSlug="acme"
        currentUserId="u"
        currentUserRole="owner"
        apiBaseUrl="/api"
      />
    );
    await screen.findByText('Person in a2');
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
  });
});
