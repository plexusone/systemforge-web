import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../AppShell';
import { Sidebar } from '../Sidebar';
import { WithSession } from './session';

const navigation = [
  {
    items: [
      { id: 'overview', label: 'Overview', href: '/orgs/org-1' },
      { id: 'billing', label: 'Billing', href: '/orgs/org-1/billing', roles: ['admin'] },
    ],
  },
];

describe('Sidebar without a TenantProvider', () => {
  it('shows items without roles and hides items whose roles it cannot check', () => {
    render(<Sidebar navigation={navigation} isCollapsed={false} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.queryByText('Billing')).toBeNull();
  });

  it('renders inside an AppShell on SessionProvider alone', async () => {
    render(
      <WithSession>
        <AppShell
          appName="Build"
          app={{ id: 'build', name: 'Build', url: '/' }}
          organizationId="org-1"
          navigation={navigation}
        >
          <p>content</p>
        </AppShell>
      </WithSession>
    );
    expect(await screen.findByText('content')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});
