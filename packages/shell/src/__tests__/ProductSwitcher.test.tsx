import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductSwitcher } from '../ProductSwitcher';
import { WithSession } from './session';

const self = { id: 'build', name: 'Build', url: '/' };

describe('ProductSwitcher', () => {
  it('lists the apps the person holds a role in for the organization', async () => {
    render(
      <WithSession>
        <ProductSwitcher self={self} organizationId="org-1" />
      </WithSession>
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'Agents' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Portfolio' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Agents' })).toHaveAttribute(
      'href',
      'https://agents.example.com'
    );
  });

  it('marks the current application and does not link it', async () => {
    render(
      <WithSession>
        <ProductSwitcher self={self} organizationId="org-1" />
      </WithSession>
    );
    const current = await screen.findByText('Build');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
  });

  it('follows the organization: another organization shows other products', async () => {
    render(
      <WithSession>
        <ProductSwitcher self={self} organizationId="org-2" />
      </WithSession>
    );
    await screen.findByText('Build');
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Agents' })).toBeNull());
  });

  it('renders the current application alone outside a session', () => {
    render(<ProductSwitcher self={self} />);
    expect(screen.getByRole('navigation', { name: 'Products' }).textContent).toBe('Build');
  });

  it('navigates client-side when given onNavigate, but not on a modified click', async () => {
    const onNavigate = vi.fn();
    render(
      <WithSession>
        <ProductSwitcher self={self} organizationId="org-1" onNavigate={onNavigate} />
      </WithSession>
    );
    const link = await screen.findByRole('link', { name: 'Agents' });
    fireEvent.click(link, { metaKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith('https://agents.example.com');
  });
});
