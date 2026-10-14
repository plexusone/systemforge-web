import { type ReactNode } from 'react';
import { Button, MonitorIcon, MoonIcon, SunIcon } from '@plexusone/ui';
import { nextTheme, useTheme, type Theme } from './theme';

const labels: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
};

/**
 * ThemeToggle cycles the theme through light, dark and the system's
 * preference, and remembers the choice.
 */
export function ThemeToggle(): ReactNode {
  const [theme, setTheme] = useTheme();
  const next = nextTheme(theme);
  const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${labels[theme]}; switch to ${labels[next].toLowerCase()}`}
      title={labels[theme]}
      onClick={() => setTheme(next)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
