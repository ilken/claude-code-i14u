# Design Tokens

> **Instructions**: Define all visual values here. Claude reads this file before writing any CSS. Fill in every section — missing tokens will be guessed, and guesses are generic.
> 
> Copy these tokens into `app/globals.css` as CSS custom properties, then extend `tailwind.config.ts` to reference them.

---

## Color Palette

### Semantic color scale
```css
:root {
  /* Brand */
  --color-brand-primary: [FILL IN — e.g., #0066FF];
  --color-brand-secondary: [FILL IN — e.g., #FF6B00];
  --color-brand-accent: [FILL IN — e.g., #00E676];

  /* Surfaces */
  --color-surface-base: [FILL IN — e.g., #FFFFFF (light) / #0A0A0A (dark)];
  --color-surface-raised: [FILL IN — e.g., #F5F5F5 / #141414];
  --color-surface-overlay: [FILL IN — e.g., #EFEFEF / #1E1E1E];
  --color-surface-sunken: [FILL IN — e.g., #E8E8E8 / #080808];

  /* Text */
  --color-text-primary: [FILL IN — e.g., #0A0A0A / #F0F0F0];
  --color-text-secondary: [FILL IN — e.g., #5C5C5C / #A0A0A0];
  --color-text-muted: [FILL IN — e.g., #9E9E9E / #606060];
  --color-text-inverse: [FILL IN — e.g., #FFFFFF / #0A0A0A];

  /* Borders */
  --color-border-default: [FILL IN — e.g., #E0E0E0 / #2A2A2A];
  --color-border-strong: [FILL IN — e.g., #BDBDBD / #404040];
  --color-border-focus: var(--color-brand-primary);

  /* Status */
  --color-status-success: #22C55E;
  --color-status-warning: #F59E0B;
  --color-status-error: #EF4444;
  --color-status-info: #3B82F6;
}
```

### Dark mode overrides
```css
.dark {
  --color-surface-base: [FILL IN];
  --color-surface-raised: [FILL IN];
  /* ... override all surface and text tokens */
}
```

---

## Spacing Grid

**Base unit**: 4px

All spacing values must be multiples of 4px. Never use arbitrary values like `px-3.5` unless part of shadcn's internal component spacing.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

---

## Typography Scale

```css
:root {
  /* Display */
  --font-display: '[FILL IN display font]', serif;
  --font-body: '[FILL IN body font]', sans-serif;
  --font-mono: '[FILL IN mono font]', monospace;

  /* Size scale (fluid via clamp is preferred) */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  /* Leading */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Tracking */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
}
```

---

## Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;      /* default UI components */
  --radius-lg: 12px;     /* cards, modals */
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px; /* pills, avatars */
}
```

---

## Elevation / Shadow

```css
:root {
  /* Subtle — inputs, dividers */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  /* Cards, dropdowns */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);

  /* Modals, popovers */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

  /* Sheet panels */
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);

  /* Focus ring */
  --shadow-focus: 0 0 0 3px rgba(var(--color-brand-primary), 0.4);
}
```

> **Glass/grain surfaces**: Define per project. Prefer `backdrop-blur-md` + `bg-surface-overlay/60` over complex box-shadow layering for glass effects.

---

## Tailwind Extension

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
        },
        surface: {
          base: 'var(--color-surface-base)',
          raised: 'var(--color-surface-raised)',
          overlay: 'var(--color-surface-overlay)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        focus: 'var(--shadow-focus)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius-md)',
      },
    },
  },
} satisfies Config;
```
