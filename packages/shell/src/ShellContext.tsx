import { COLLAPSED_KEY, adoptCarriedPreferences } from './preferences';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { ShellContextValue, AppShellConfig } from './types';

/**
 * Shell context
 */
const ShellContext = createContext<ShellContextValue | null>(null);

/**
 * Shell provider props
 */
export interface ShellProviderProps extends Partial<AppShellConfig> {
  children: ReactNode;
}


/**
 * ShellProvider - Provides shell state to components
 */
export function ShellProvider({
  children,
  defaultCollapsed = false,
  onNavigate,
  onCollapseChange,
}: ShellProviderProps) {
  // Initialize collapsed state from localStorage, after adopting a state
  // another application of the suite carried in the link
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    if (typeof window !== 'undefined') {
      adoptCarriedPreferences();
      const stored = localStorage.getItem(COLLAPSED_KEY);
      return stored ? stored === 'true' : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  /**
   * Toggle sidebar collapsed state
   */
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      }
      onCollapseChange?.(next);
      return next;
    });
  }, [onCollapseChange]);

  /**
   * Set sidebar collapsed state
   */
  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      setSidebarCollapsedState(collapsed);
      if (typeof window !== 'undefined') {
        localStorage.setItem(COLLAPSED_KEY, String(collapsed));
      }
      onCollapseChange?.(collapsed);
    },
    [onCollapseChange]
  );

  /**
   * Toggle sidebar visibility (mobile)
   */
  const toggleSidebarVisible = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  /**
   * Navigate to path
   */
  const navigate = useCallback(
    (href: string) => {
      if (onNavigate) {
        onNavigate(href);
      } else {
        window.location.assign(href);
      }
      setCurrentPath(href);
      // Close mobile sidebar on navigation
      setSidebarVisible(false);
    },
    [onNavigate]
  );

  /**
   * Listen for popstate events
   */
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const value = useMemo<ShellContextValue>(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      sidebarVisible,
      toggleSidebarVisible,
      currentPath,
      setCurrentPath,
      navigate,
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      sidebarVisible,
      toggleSidebarVisible,
      currentPath,
      navigate,
    ]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

/**
 * Hook to access shell context
 *
 * @throws Error if used outside ShellProvider
 */
export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider');
  }
  return context;
}

/**
 * Get shell context without throwing
 */
export function useShellOptional(): ShellContextValue | null {
  return useContext(ShellContext);
}
