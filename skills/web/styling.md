# Styling

TailwindCSS conventions and patterns for the web project.

---

## Core Principles

- **Utility-first** -- use Tailwind classes, no custom CSS unless absolutely necessary
- **No inline styles** -- all styling through Tailwind classes
- **Design tokens** via `tailwind.config.ts` for colors, spacing, and fonts

## Conditional Classes

Use the `cn()` helper (clsx + tailwind-merge) for conditional and merged classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-primary text-white',
  className
)} />
```

## Responsive Design

Mobile-first approach using Tailwind breakpoints:

```
sm:   640px+
md:   768px+
lg:   1024px+
xl:   1280px+
2xl:  1536px+
```

Write base styles for mobile, then add breakpoints for larger screens:

```html
<div className="flex flex-col md:flex-row lg:gap-8">
```

## Dark Mode

Use the `dark:` variant for dark mode support:

```html
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

## What to Avoid

- Inline `style` attributes
- Custom CSS files (unless for truly global styles or third-party overrides)
- Arbitrary values when a design token exists
- Raw color values -- use theme colors from `tailwind.config.ts`
