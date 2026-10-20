import { THEME_STORAGE_KEY, type Theme } from './theme';

/** The key the sidebar's collapsed state is stored under. */
export const COLLAPSED_KEY = 'systemforge:sidebar-collapsed';

/**
 * The URL fragment keys that carry interface preferences between the
 * applications of a suite. Each application runs on its own host, so its
 * stored preferences are its own; a link to another application carries
 * them, and the application it opens adopts them. A fragment never reaches
 * a server.
 */
const SIDEBAR_PARAM = 'sf-sidebar';
const THEME_PARAM = 'sf-theme';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage unavailable: nothing to carry
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the preference lasts for this page only
  }
}

/** Preferences to carry; omitted ones are read from storage. */
export interface CarriedPreferences {
  sidebarCollapsed?: boolean;
  theme?: Theme;
}

/**
 * carryPreferences adds this application's sidebar state and theme to a
 * link to another application of the suite, as a fragment. A URL that
 * already has a fragment is left as it is.
 */
export function carryPreferences(url: string, prefs: CarriedPreferences = {}): string {
  if (typeof window === 'undefined' || url.includes('#')) return url;
  const p = new URLSearchParams();
  const collapsed = prefs.sidebarCollapsed ?? read(COLLAPSED_KEY) === 'true';
  p.set(SIDEBAR_PARAM, collapsed ? 'collapsed' : 'expanded');
  const theme = prefs.theme ?? read(THEME_STORAGE_KEY);
  if (theme === 'light' || theme === 'dark' || theme === 'system') p.set(THEME_PARAM, theme);
  return `${url}#${p.toString()}`;
}

/**
 * adoptCarriedPreferences stores preferences carried in this page's
 * fragment and removes them from the address bar. applyStoredTheme calls it,
 * before the first render.
 */
export function adoptCarriedPreferences(): void {
  if (typeof window === 'undefined' || !window.location.hash) return;
  const p = new URLSearchParams(window.location.hash.slice(1));
  const sidebar = p.get(SIDEBAR_PARAM);
  const theme = p.get(THEME_PARAM);
  if (sidebar === null && theme === null) return;
  if (sidebar === 'collapsed' || sidebar === 'expanded')
    write(COLLAPSED_KEY, String(sidebar === 'collapsed'));
  if (theme === 'light' || theme === 'dark' || theme === 'system') write(THEME_STORAGE_KEY, theme);
  p.delete(SIDEBAR_PARAM);
  p.delete(THEME_PARAM);
  const rest = p.toString();
  const { pathname, search } = window.location;
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${search}${rest ? `#${rest}` : ''}`
  );
}
