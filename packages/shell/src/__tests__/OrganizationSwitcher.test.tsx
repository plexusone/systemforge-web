import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SessionMembership } from '@plexusone/auth';
import { OrganizationSwitcher } from '../OrganizationSwitcher';
import { WithSession } from './session';

function open() {
  const trigger = screen.getByRole('button', { name: 'Switch organization' });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'Enter' });
  return trigger;
}

describe('OrganizationSwitcher', () => {
  it('shows the current organization by name, falling back to slug', async () => {
    const { rerender } = render(
      <WithSession>
        <OrganizationSwitcher value="org-1" onChange={() => {}} />
      </WithSession>
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Switch organization' })).toHaveTextContent('Acme')
    );
    rerender(
      <WithSession>
        <OrganizationSwitcher value="org-2" onChange={() => {}} />
      </WithSession>
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Switch organization' })).toHaveTextContent('side')
    );
  });

  it('reports the chosen organization by ID and keeps no state of its own', async () => {
    const onChange = vi.fn();
    render(
      <WithSession>
        <OrganizationSwitcher value="org-1" onChange={onChange} />
      </WithSession>
    );
    await screen.findByRole('button', { name: 'Switch organization' });
    open();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'side' }));
    expect(onChange).toHaveBeenCalledWith('org-2');
    expect(screen.getByRole('button', { name: 'Switch organization' })).toHaveTextContent('Acme');
  });

  it('does not report choosing the current organization', async () => {
    const onChange = vi.fn();
    render(
      <WithSession>
        <OrganizationSwitcher value="org-1" onChange={onChange} />
      </WithSession>
    );
    await screen.findByRole('button', { name: 'Switch organization' });
    open();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Acme' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(
      <WithSession>
        <OrganizationSwitcher value="org-1" onChange={() => {}} />
      </WithSession>
    );
    await screen.findByRole('button', { name: 'Switch organization' });
    const trigger = open();
    const menu = await screen.findByRole('menu');
    fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('is hidden with one membership unless alwaysShow', () => {
    const one: SessionMembership[] = [
      { organizationId: 'org-1', organizationName: 'Acme', applications: {} },
    ];
    const { rerender } = render(
      <OrganizationSwitcher value="org-1" onChange={() => {}} memberships={one} />
    );
    expect(screen.queryByRole('button', { name: 'Switch organization' })).toBeNull();
    rerender(
      <OrganizationSwitcher value="org-1" onChange={() => {}} memberships={one} alwaysShow />
    );
    expect(screen.getByRole('button', { name: 'Switch organization' })).toBeInTheDocument();
  });

  it('prompts for a choice when the value matches no membership', async () => {
    render(
      <WithSession>
        <OrganizationSwitcher value="org-unknown" onChange={() => {}} />
      </WithSession>
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Switch organization' })).toHaveTextContent(
        'Choose organization'
      )
    );
  });
});
