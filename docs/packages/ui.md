# @plexusone/ui

Accessible React components on Radix UI, styled with Tailwind v4 and themed
with CSS variables. The shell is built from them.

## Installation

```bash
pnpm add @plexusone/ui
```

## Components

| Component     | Exports                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Button        | `Button`, `buttonVariants`                                                                           |
| Form controls | `Input`, `Label`                                                                                     |
| Card          | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`                    |
| Avatar        | `Avatar`, `AvatarImage`, `AvatarFallback`                                                            |
| Dropdown menu | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` and the other parts |
| Tooltip       | `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`                                     |
| Badge         | `Badge`, `badgeVariants`                                                                             |
| Separator     | `Separator`                                                                                          |
| Icons         | `MenuIcon`, `UserIcon`, `SunIcon`, `MoonIcon`, `MonitorIcon` and others                              |

`cn` merges class names, resolving conflicting Tailwind classes.

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@plexusone/ui';

<Card>
  <CardHeader>
    <CardTitle>Sites</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Add site</Button>
  </CardContent>
</Card>;
```

## Styles

The package publishes two things for styling:

- `@plexusone/ui/globals.css`: compiled CSS with the theme's values (the
  `--color-*` variables, light and `.dark`) and the classes these
  components use.
- `@plexusone/ui/tailwind`: a Tailwind config that gives the theme's colors
  names (`bg-primary`, `text-muted-foreground`, `border-border`).

An application runs Tailwind v4 itself and uses both:

```css
@import 'tailwindcss';
@import '@plexusone/ui/globals.css';

@config '@plexusone/ui/tailwind';
@custom-variant dark (&:where(.dark, .dark *));
```

Override a `--color-*` variable after the import to change the theme.
Applications using `@plexusone/shell` also scan its built files; see
[@plexusone/shell](shell.md).
