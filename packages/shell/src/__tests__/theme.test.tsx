import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from '../Navbar';
import { ThemeToggle } from '../ThemeToggle';
import {
  THEME_STORAGE_KEY,
  applyStoredTheme,
  applyTheme,
  nextTheme,
  readStoredTheme,
  resolveTheme,
} from '../theme';

const root = document.documentElement;
const originalMatchMedia = window.matchMedia;

/** A matchMedia whose dark preference the test controls. */
function mockPrefersDark(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return (next: boolean) => {
    matches = next;
    listeners.forEach((l) => l());
  };
}

beforeEach(() => {
  window.localStorage.clear();
  root.classList.remove('dark');
  root.style.colorScheme = '';
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe('theme functions', () => {
  it('cycles light, dark, system', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
    expect(nextTheme('system')).toBe('light');
  });

  it('resolves system from the preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('reads system when nothing valid is stored', () => {
    expect(readStoredTheme()).toBe('system');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readStoredTheme()).toBe('system');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readStoredTheme()).toBe('dark');
  });

  it('falls back to system when storage throws', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredTheme()).toBe('system');
  });

  it('sets the dark class and color-scheme on the root element', () => {
    applyTheme('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
    applyTheme('light');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  it('applies the stored theme before render', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    applyStoredTheme();
    expect(root.classList.contains('dark')).toBe(true);
  });
});

describe('ThemeToggle', () => {
  it('cycles, stores the choice and applies it', () => {
    mockPrefersDark(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /^Light theme/ }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^Dark theme/ }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('keeps several toggles in agreement', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('title'))).toEqual([
      'Dark theme',
      'Dark theme',
    ]);
  });

  it('follows the system preference while on system', () => {
    const setPrefersDark = mockPrefersDark(false);
    render(<ThemeToggle />);
    expect(root.classList.contains('dark')).toBe(false);
    act(() => setPrefersDark(true));
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('still works when storage throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /^System theme/ }));
    expect(screen.getByRole('button', { name: /^Light theme/ })).toBeInTheDocument();
  });
});

describe('Navbar theme toggle', () => {
  it('is off by default and shown with showThemeToggle', () => {
    const { rerender } = render(<Navbar />);
    expect(screen.queryByRole('button', { name: /theme/ })).toBeNull();
    rerender(<Navbar showThemeToggle />);
    expect(screen.getByRole('button', { name: /theme/ })).toBeInTheDocument();
  });
});
