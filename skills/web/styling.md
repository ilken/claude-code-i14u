# Web Styling — Tailwind CSS + shadcn/ui

Conventions for building the component library using Tailwind CSS and shadcn/ui.

---

## Stack

- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — copy-paste component primitives built on Radix UI
- **`cn()` helper** — merge class names with conflict resolution

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Component Library Structure

```
components/
└── ui/
    ├── button.tsx          # shadcn primitive
    ├── card.tsx            # shadcn primitive
    ├── input.tsx           # shadcn primitive
    ├── dialog.tsx          # shadcn primitive
    ├── badge.tsx           # shadcn + custom variants
    ├── data-table.tsx      # custom composite using shadcn
    └── stat-card.tsx       # fully custom primitive
```

**Rule**: `components/ui/` contains only primitives. Feature-specific assemblies go in `components/features/`.

---

## Adding shadcn Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card input badge dialog
```

Components are copied into `components/ui/` — they're yours to modify.

---

## Custom Variants Pattern

Extend shadcn components with `cva` (class-variance-authority):

```typescript
// components/ui/badge.tsx
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);
```

---

## Design Tokens via CSS Custom Properties

All design values defined in `globals.css` as CSS custom properties. Tailwind extended to use them.

```css
/* app/globals.css */
@layer base {
  :root {
    /* Load from DESIGN-TOKENS.md */
    --color-brand-primary: ...;
    --color-surface-base: ...;
    --radius: 0.5rem;
  }
  .dark {
    --color-surface-base: ...;
  }
}
```

See `DESIGN-TOKENS.md` in project root for full token definitions.

---

## Tailwind Class Ordering

Follow the Prettier Tailwind plugin order (enforced automatically if configured):
1. Layout (display, position, z-index)
2. Box model (w, h, p, m)
3. Typography (font, text, leading)
4. Visual (bg, border, shadow, opacity)
5. Interactive (cursor, transition, hover/focus)

---

## Rules

- **Never hardcode colors** — use CSS custom property tokens or Tailwind semantic classes
- **No inline styles** — use Tailwind classes or CSS custom properties
- **Responsive first** — write mobile styles first, add `md:` / `lg:` overrides
- **Dark mode via `dark:` prefix** — do not create separate dark stylesheets
- **`cn()` for conditional classes** — never string-concatenate class names
- **shadcn for primitives** — don't rebuild buttons, inputs, dialogs from scratch

---

## Referencing Design System

When building UI, always check:
1. `DESIGN-TOKENS.md` — what tokens exist
2. `BRAND-VOICE.md` — what aesthetic to aim for
3. `MOTION-SPEC.md` — how interactions should feel

If these files don't exist in the project root, generate them from the templates in `~/Developer/claude-code-i14u/skills/shared/templates/`.
