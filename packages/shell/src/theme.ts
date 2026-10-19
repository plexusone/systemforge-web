import { useCallback, useEffect, useState } from 'react';
import { adoptCarriedPreferences } from './preferences';

/** A theme choice. `system` follows the operating system's preference. */
export type Theme = 'light' | 'dark' | 'system';

/** The key the theme choice is stored under. */
export const THEME_STORAGE_KEY = 'systemforge:theme';

/** Dispatched on window when the theme changes, so every toggle agrees. */
export const THEME_CHANGE_EVENT = 'systemforge:theme-change';

const darkQuery = '(prefers-color-scheme: dark)';

function isTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark' || v === 'system';
}

/** The stored theme, or `system` when none is stored or storage is unavailable. */
export function readStoredTheme(): Theme {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(v) ? v : 'system';
  } catch {
    // Storage is unavailable (a private window, blocked site data): the
    // choice lasts for this page only.
    return 'system';
  }
}

function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // As in readStoredTheme: without storage the choice is not remembered.
  }
}

/** Whether the operating system prefers dark. */
export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(darkQuery).matches;
}

/** The theme actually shown for a choice. */
export function resolveTheme(theme: Theme, prefersDark = systemPrefersDark()): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

/**
 * Applies a theme to the root element: the `dark` class the design system's
 * styles key on, and `color-scheme` for native controls.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const resolved = resolveTheme(theme);
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

/**
 * Applies the stored theme, after adopting preferences carried in the link.
 * Call it before the first render, so the page does not flash the other
 * theme and the sidebar opens as it was in the application linking here.
 */
export function applyStoredTheme(): void {
  // Preferences another application of the suite carried in the link come
  // first, so the page opens as the person left the other one.
  adoptCarriedPreferences();
  applyTheme(readStoredTheme());
}

/** The order the toggle cycles through. */
export function nextTheme(theme: Theme): Theme {
  return theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
}

/**
 * The current theme choice and a setter. Setting it stores the choice,
 * applies it to the root element and tells other instances. A `system`
 * choice follows changes in the operating system's preference.
 */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'system' : readStoredTheme()
  );

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(darkQuery);
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (isTheme(next)) setThemeState(next);
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: next }));
  }, []);

  return [theme, setTheme];
}
