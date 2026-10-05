# @plexusone/design-tokens

Design system tokens for consistent styling.

## Installation

```bash
pnpm add @plexusone/design-tokens
```

## Features

- Color palette with semantic tokens
- Typography scale
- Spacing scale
- Breakpoints
- Shadows
- Border radii
- Z-index scale
- CSS custom properties
- Tailwind CSS preset

## Usage

### Direct Import

```tsx
import { colors, spacing, typography } from '@plexusone/design-tokens';

const styles = {
  color: colors.primary[500],
  padding: spacing[4],
  fontSize: typography.sizes.lg,
};
```

### CSS Custom Properties

```css
.button {
  background-color: var(--cf-color-primary-500);
  padding: var(--cf-spacing-4);
  font-size: var(--cf-font-size-lg);
  border-radius: var(--cf-radius-md);
}
```

### With Tailwind CSS

```js
// tailwind.config.js
import { tailwindPreset } from '@plexusone/design-tokens';

export default {
  presets: [tailwindPreset],
  // your config...
};
```

## Tokens

### Colors

```typescript
import { colors } from '@plexusone/design-tokens';

colors.primary[500]; // Primary brand color
colors.secondary[500]; // Secondary color
colors.success[500]; // Success states
colors.warning[500]; // Warning states
colors.error[500]; // Error states
colors.gray[500]; // Neutral gray
```

### Typography

```typescript
import { typography } from '@plexusone/design-tokens';

typography.sizes.xs; // 12px
typography.sizes.sm; // 14px
typography.sizes.base; // 16px
typography.sizes.lg; // 18px
typography.sizes.xl; // 20px
typography.sizes['2xl']; // 24px
typography.sizes['3xl']; // 30px

typography.weights.normal; // 400
typography.weights.medium; // 500
typography.weights.semibold; // 600
typography.weights.bold; // 700

typography.lineHeights.tight; // 1.25
typography.lineHeights.normal; // 1.5
typography.lineHeights.relaxed; // 1.75
```

### Spacing

```typescript
import { spacing } from '@plexusone/design-tokens';

spacing[0]; // 0
spacing[1]; // 4px
spacing[2]; // 8px
spacing[3]; // 12px
spacing[4]; // 16px
spacing[6]; // 24px
spacing[8]; // 32px
spacing[12]; // 48px
spacing[16]; // 64px
```

### Breakpoints

```typescript
import { breakpoints } from '@plexusone/design-tokens';

breakpoints.sm; // 640px
breakpoints.md; // 768px
breakpoints.lg; // 1024px
breakpoints.xl; // 1280px
breakpoints['2xl']; // 1536px
```

### Shadows

```typescript
import { shadows } from '@plexusone/design-tokens';

shadows.sm; // Small shadow
shadows.md; // Medium shadow
shadows.lg; // Large shadow
shadows.xl; // Extra large shadow
```

### Border Radii

```typescript
import { radii } from '@plexusone/design-tokens';

radii.none; // 0
radii.sm; // 2px
radii.md; // 4px
radii.lg; // 8px
radii.xl; // 12px
radii.full; // 9999px
```

### Z-Index

```typescript
import { zIndex } from '@plexusone/design-tokens';

zIndex.dropdown; // 1000
zIndex.sticky; // 1100
zIndex.modal; // 1200
zIndex.popover; // 1300
zIndex.tooltip; // 1400
```

## CSS Variables

All tokens are available as CSS custom properties:

```css
:root {
  --cf-color-primary-500: #6366f1;
  --cf-spacing-4: 16px;
  --cf-font-size-lg: 18px;
  --cf-radius-md: 4px;
  --cf-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```
