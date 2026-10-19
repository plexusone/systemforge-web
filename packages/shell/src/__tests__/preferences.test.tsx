import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProductSwitcher } from '../ProductSwitcher';
import { ShellProvider, useShell } from '../ShellContext';
import { COLLAPSED_KEY, adoptCarriedPreferences, carryPreferences } from '../preferences';
import { THEME_STORAGE_KEY } from '../theme';
import { WithSession } from './session';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('carryPreferences', () => {
  it('adds the stored sidebar state and theme as a fragment', () => {
    localStorage.setItem(COLLAPSED_KEY, 'true');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(carryPreferences('http://agents.example.test/')).toBe(
      'http://agents.example.test/#sf-sidebar=collapsed&sf-theme=dark'
    );
  });

  it('defaults to an expanded sidebar and carries no unknown theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(carryPreferences('/x')).toBe('/x#sf-sidebar=expanded');
  });

  it('leaves a link with a fragment alone', () => {
    expect(carryPreferences('/x#section')).toBe('/x#section');
  });
});

describe('adoptCarriedPreferences', () => {
  it('stores carried preferences and strips them from the address', () => {
    window.history.replaceState(null, '', '/orgs/o1?tab=a#sf-sidebar=collapsed&sf-theme=light');
    adoptCarriedPreferences();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe('true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/orgs/o1?tab=a'
    );
  });

  it('ignores an unrelated fragment and invalid values', () => {
    window.history.replaceState(null, '', '/#section');
    adoptCarriedPreferences();
    expect(window.location.hash).toBe('#section');
    window.history.replaceState(null, '', '/#sf-sidebar=wide&sf-theme=sepia');
    adoptCarriedPreferences();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});

function Collapsed() {
  const { sidebarCollapsed } = useShell();
  return <span>{sidebarCollapsed ? 'collapsed' : 'expanded'}</span>;
}

describe('ShellProvider', () => {
  it('opens with the sidebar state carried in the link', () => {
    localStorage.setItem(COLLAPSED_KEY, 'false');
    window.history.replaceState(null, '', '/#sf-sidebar=collapsed');
    render(
      <ShellProvider>
        <Collapsed />
      </ShellProvider>
    );
    expect(screen.getByText('collapsed')).toBeTruthy();
    expect(window.location.hash).toBe('');
  });
});

describe('ProductSwitcher', () => {
  it('carries the current preferences when a link is followed', async () => {
    render(
      <WithSession>
        <ProductSwitcher self={{ id: 'build', name: 'Build', url: '/' }} organizationId="org-1" />
      </WithSession>
    );
    const link = await screen.findByRole('link', { name: 'Agents' });
    expect(link).toHaveAttribute('href', 'https://agents.example.com');
    // Toggled after the switcher rendered: the link still carries it.
    localStorage.setItem(COLLAPSED_KEY, 'true');
    fireEvent.click(link);
    expect(link).toHaveAttribute('href', 'https://agents.example.com#sf-sidebar=collapsed');
  });
});
