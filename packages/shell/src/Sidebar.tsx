import { type ReactNode } from 'react';
import { useRoleCheck } from '@plexusone/tenant';
import {
  Badge,
  Button,
  ExternalLinkIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  cn,
} from '@plexusone/ui';
import type { SidebarProps, NavItem, NavSection } from './types';

/**
 * NavItem component
 */
function NavItemComponent({
  item,
  isCollapsed,
  onNavigate,
  currentPath,
}: {
  item: NavItem;
  isCollapsed: boolean;
  onNavigate?: (href: string) => void;
  currentPath?: string;
}): ReactNode {
  const { hasRole } = useRoleCheck();

  // Check role access
  if (item.roles && !hasRole(item.roles as ('member' | 'admin' | 'owner')[])) {
    return null;
  }

  const isActive = item.isActive ?? currentPath === item.href;

  const handleClick = (event: React.MouseEvent) => {
    if (item.external) return; // Let browser handle external links

    event.preventDefault();
    if (onNavigate) {
      onNavigate(item.href);
    } else {
      window.location.assign(item.href);
    }
  };

  return (
    <a
      href={item.href}
      onClick={handleClick}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 mb-0.5 no-underline rounded-md text-sm transition-colors',
        isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5',
        isActive
          ? 'bg-accent text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {item.icon && (
        <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">{item.icon}</span>
      )}

      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>

          {item.badge !== undefined && (
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {item.badge}
            </Badge>
          )}

          {item.external && <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />}
        </>
      )}
    </a>
  );
}

/**
 * NavSection component
 */
function NavSectionComponent({
  section,
  isCollapsed,
  onNavigate,
  currentPath,
}: {
  section: NavSection;
  isCollapsed: boolean;
  onNavigate?: (href: string) => void;
  currentPath?: string;
}): ReactNode {
  return (
    <div className="mb-4">
      {section.title && !isCollapsed && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {section.title}
        </div>
      )}

      {section.items.map((item) => (
        <NavItemComponent
          key={item.id}
          item={item}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
          currentPath={currentPath}
        />
      ))}
    </div>
  );
}

/**
 * Sidebar - Main navigation sidebar
 *
 * @example
 * ```tsx
 * <Sidebar
 *   navigation={[
 *     {
 *       items: [
 *         { id: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
 *         { id: 'settings', label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
 *       ],
 *     },
 *   ]}
 *   isCollapsed={false}
 * />
 * ```
 */
export function Sidebar({
  navigation,
  isCollapsed,
  onToggleCollapse,
  logo,
  logoCollapsed,
  onNavigate,
  currentPath,
}: SidebarProps): ReactNode {
  return (
    <aside
      className={cn(
        'h-screen bg-background border-r border-border flex flex-col transition-[width] duration-200 overflow-hidden flex-shrink-0',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'p-4 border-b border-border flex items-center h-16',
          isCollapsed ? 'justify-center' : 'justify-start'
        )}
      >
        {isCollapsed ? logoCollapsed || logo : logo}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
        {navigation.map((section, index) => (
          <NavSectionComponent
            key={section.title || index}
            section={section}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
            currentPath={currentPath}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn('w-full', isCollapsed ? 'justify-center' : 'justify-start')}
          >
            {isCollapsed ? (
              <PanelLeftOpenIcon className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftCloseIcon className="h-5 w-5 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}
