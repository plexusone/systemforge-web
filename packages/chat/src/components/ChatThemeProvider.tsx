'use client';

import * as React from 'react';

export interface ChatTheme {
  /** Primary color for buttons, accents */
  primary: string;
  /** Primary color on hover */
  primaryHover: string;
  /** Text color on primary background */
  primaryForeground: string;
  /** Background color for the chat container */
  background: string;
  /** Foreground/text color */
  foreground: string;
  /** Muted background color */
  muted: string;
  /** Muted foreground color */
  mutedForeground: string;
  /** Border color */
  border: string;
  /** User message background */
  userMessageBg: string;
  /** User message text color */
  userMessageFg: string;
  /** Assistant message background */
  assistantMessageBg: string;
  /** Assistant message text color */
  assistantMessageFg: string;
  /** Border radius for messages and buttons */
  borderRadius: string;
  /** Font family */
  fontFamily?: string;
}

export const lightTheme: ChatTheme = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryForeground: '#ffffff',
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  userMessageBg: '#2563eb',
  userMessageFg: '#ffffff',
  assistantMessageBg: '#f1f5f9',
  assistantMessageFg: '#0f172a',
  borderRadius: '0.75rem',
};

export const darkTheme: ChatTheme = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryForeground: '#ffffff',
  background: '#0f172a',
  foreground: '#f1f5f9',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  border: '#334155',
  userMessageBg: '#3b82f6',
  userMessageFg: '#ffffff',
  assistantMessageBg: '#1e293b',
  assistantMessageFg: '#f1f5f9',
  borderRadius: '0.75rem',
};

interface ChatThemeContextValue {
  theme: ChatTheme;
  setTheme: (theme: ChatTheme | 'light' | 'dark') => void;
  mode: 'light' | 'dark' | 'custom';
}

const ChatThemeContext = React.createContext<ChatThemeContextValue | null>(null);

export interface ChatThemeProviderProps {
  /** Initial theme */
  theme?: ChatTheme | 'light' | 'dark';
  /** Children */
  children: React.ReactNode;
}

/**
 * ChatThemeProvider - Provides theming for chat components.
 *
 * @example
 * ```tsx
 * // Use built-in dark theme
 * <ChatThemeProvider theme="dark">
 *   <ChatWidget />
 * </ChatThemeProvider>
 *
 * // Use custom theme
 * <ChatThemeProvider theme={{
 *   ...lightTheme,
 *   primary: '#8b5cf6',
 *   primaryHover: '#7c3aed',
 * }}>
 *   <ChatWidget />
 * </ChatThemeProvider>
 * ```
 */
export function ChatThemeProvider({
  theme: initialTheme = 'light',
  children,
}: ChatThemeProviderProps) {
  const [themeState, setThemeState] = React.useState<{
    theme: ChatTheme;
    mode: 'light' | 'dark' | 'custom';
  }>(() => {
    if (initialTheme === 'light') return { theme: lightTheme, mode: 'light' };
    if (initialTheme === 'dark') return { theme: darkTheme, mode: 'dark' };
    return { theme: initialTheme, mode: 'custom' };
  });

  const setTheme = React.useCallback((newTheme: ChatTheme | 'light' | 'dark') => {
    if (newTheme === 'light') {
      setThemeState({ theme: lightTheme, mode: 'light' });
    } else if (newTheme === 'dark') {
      setThemeState({ theme: darkTheme, mode: 'dark' });
    } else {
      setThemeState({ theme: newTheme, mode: 'custom' });
    }
  }, []);

  const cssVariables = React.useMemo(
    () =>
      ({
        '--chat-primary': themeState.theme.primary,
        '--chat-primary-hover': themeState.theme.primaryHover,
        '--chat-primary-foreground': themeState.theme.primaryForeground,
        '--chat-background': themeState.theme.background,
        '--chat-foreground': themeState.theme.foreground,
        '--chat-muted': themeState.theme.muted,
        '--chat-muted-foreground': themeState.theme.mutedForeground,
        '--chat-border': themeState.theme.border,
        '--chat-user-message-bg': themeState.theme.userMessageBg,
        '--chat-user-message-fg': themeState.theme.userMessageFg,
        '--chat-assistant-message-bg': themeState.theme.assistantMessageBg,
        '--chat-assistant-message-fg': themeState.theme.assistantMessageFg,
        '--chat-border-radius': themeState.theme.borderRadius,
        ...(themeState.theme.fontFamily && { '--chat-font-family': themeState.theme.fontFamily }),
      }) as React.CSSProperties,
    [themeState.theme]
  );

  const contextValue = React.useMemo(
    () => ({
      theme: themeState.theme,
      setTheme,
      mode: themeState.mode,
    }),
    [themeState, setTheme]
  );

  return (
    <ChatThemeContext.Provider value={contextValue}>
      <div style={cssVariables} className="chat-theme-root">
        {children}
      </div>
    </ChatThemeContext.Provider>
  );
}

/**
 * Hook to access the chat theme context.
 */
export function useChatTheme(): ChatThemeContextValue {
  const context = React.useContext(ChatThemeContext);
  if (!context) {
    // Return default light theme if not wrapped in provider
    return {
      theme: lightTheme,
      setTheme: () => {},
      mode: 'light',
    };
  }
  return context;
}

/**
 * Creates a custom theme by merging with the base theme.
 */
export function createTheme(base: 'light' | 'dark', overrides: Partial<ChatTheme>): ChatTheme {
  const baseTheme = base === 'dark' ? darkTheme : lightTheme;
  return { ...baseTheme, ...overrides };
}
