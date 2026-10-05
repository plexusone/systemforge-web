import { type ReactNode } from 'react';
import { ChevronRightIcon, HomeIcon, cn } from '@plexusone/ui';
import type { BreadcrumbsProps } from './types';

/**
 * Breadcrumbs - Navigation breadcrumb trail
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Settings', href: '/settings' },
 *     { label: 'Profile' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  onNavigate,
  separator,
  maxItems,
}: BreadcrumbsProps): ReactNode {
  if (items.length === 0) {
    return null;
  }

  const handleClick = (href: string | undefined, event: React.MouseEvent) => {
    if (!href) return;

    event.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.assign(href);
    }
  };

  // Collapse items if maxItems specified
  let displayItems = items;
  let collapsed = false;

  if (maxItems && items.length > maxItems) {
    collapsed = true;
    displayItems = [items[0], { label: '...', href: undefined }, ...items.slice(-(maxItems - 2))];
  }

  const defaultSeparator = <ChevronRightIcon className="h-4 w-4" />;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 list-none m-0 p-0 text-sm">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;
          const isCollapsed = collapsed && index === 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-muted-foreground flex items-center" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}

              {isCollapsed ? (
                <span className="text-muted-foreground px-1 py-0.5">{item.label}</span>
              ) : item.href && !isLast ? (
                <a
                  href={item.href}
                  onClick={(e) => handleClick(item.href, e)}
                  className="flex items-center gap-1 text-muted-foreground no-underline px-1 py-0.5 rounded hover:text-foreground hover:bg-accent"
                >
                  {isFirst && !item.icon && <HomeIcon className="h-4 w-4" />}
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1 px-1 py-0.5',
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && !item.icon && <HomeIcon className="h-4 w-4" />}
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
