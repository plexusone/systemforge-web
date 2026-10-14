import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../AppShell';
import { Navbar } from '../Navbar';
import { WithSession } from './session';

const app = { id: 'build', name: 'Build', url: '/' };

function slotOrder(header: HTMLElement): string[] {
  const order: string[] = [];
  header
    .querySelectorAll(
      '[data-slot], nav[aria-label="Products"], button[aria-label="Switch organization"]'
    )
    .forEach((el) => {
      if (el.getAttribute('data-slot')) order.push(el.getAttribute('data-slot')!);
      else if (el.tagName === 'NAV') order.push('products');
      else order.push('organization');
    });
  return order;
}

describe('Navbar slots', () => {
  it('renders with no auth or tenant provider', () => {
    render(<Navbar />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('places brand, switchers, command and actions in order', async () => {
    render(
      <WithSession>
        <Navbar
          brand={<span>Acme Suite</span>}
          app={app}
          organizationId="org-1"
          onOrganizationChange={() => {}}
          command={<input aria-label="Search" />}
          actions={<button>Notifications</button>}
        />
      </WithSession>
    );
    await screen.findByRole('link', { name: 'Agents' });
    expect(slotOrder(screen.getByRole('banner'))).toEqual([
      'brand',
      'products',
      'organization',
      'command',
      'actions',
    ]);
    expect(screen.getByText('Acme Suite')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('leaves out slots that are not given', () => {
    render(<Navbar />);
    expect(slotOrder(screen.getByRole('banner'))).toEqual([]);
  });

  it('uses the controlled organization switcher when the application owns the organization', async () => {
    render(
      <WithSession>
        <Navbar app={app} organizationId="org-2" onOrganizationChange={() => {}} />
      </WithSession>
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Switch organization' })).toHaveTextContent('side')
    );
  });
});

describe('AppShell', () => {
  it('passes the slots and breadcrumbs to the navbar', async () => {
    render(
      <WithSession>
        <AppShell
          appName="Build"
          app={app}
          organizationId="org-1"
          onOrganizationChange={() => {}}
          actions={<button>Notifications</button>}
          breadcrumbs={[{ label: 'Initiatives', href: '/i' }, { label: 'One' }]}
        >
          <p>content</p>
        </AppShell>
      </WithSession>
    );
    const header = screen.getByRole('banner');
    await within(header).findByRole('link', { name: 'Agents' });
    expect(within(header).getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(within(header).getByText('Initiatives')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
