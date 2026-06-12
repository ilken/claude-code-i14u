# Motion Spec

> **Instructions**: Define exactly how UI elements move. Claude ignores transitions when not told — this file prevents that. Fill in durations and curves that match the product's personality from `BRAND-VOICE.md`.

---

## Core Principles

1. **Motion has meaning** — every animation communicates state, not decoration
2. **Fast in, slow out** — elements appear quickly, disappear even faster
3. **No bounce** — avoid spring physics with overshoot; prefer high-tension snappy springs
4. **Respect reduced motion** — always wrap non-essential animations in `@media (prefers-reduced-motion: no-preference)`

---

## Duration Scale

```css
:root {
  --duration-instant: 80ms;   /* Hover highlights, checkbox tick */
  --duration-fast: 150ms;     /* Button press feedback, badge swap */
  --duration-normal: 200ms;   /* Dropdown open, tooltip appear */
  --duration-moderate: 300ms; /* Modal slide-in, page transition */
  --duration-slow: 450ms;     /* Complex layout shifts, hero animations */
}
```

**Rule**: UI feedback (hover, press) uses `fast`. Content appearing uses `normal`–`moderate`. Never exceed `slow` for interactive elements.

---

## Easing Curves

```css
:root {
  /* Standard — most UI interactions */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* Decelerate — elements entering the screen */
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

  /* Accelerate — elements leaving the screen */
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

  /* Sharp — high-tension snappy spring feel (no overshoot) */
  --ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);

  /* Expressive — for brand moments (hero, onboarding only) */
  --ease-expressive: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Element-Specific Rules

### Buttons & Interactive Controls
```css
button, [role="button"] {
  transition: background-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard),
              transform var(--duration-fast) var(--ease-standard);
}
button:active {
  transform: scale(0.97);
}
```

### Dropdowns & Popovers
- Enter: `opacity 0→1` + `translateY(-4px)→0` in `var(--duration-normal)` with `--ease-decelerate`
- Exit: `opacity 1→0` + `translateY(0)→-4px` in `var(--duration-fast)` with `--ease-accelerate`

### Modals & Dialogs
- Overlay: `opacity 0→0.6` in `var(--duration-normal)`
- Panel: `opacity 0→1` + `translateY(8px)→0` in `var(--duration-moderate)` with `--ease-decelerate`
- Exit: reverse, `var(--duration-fast)`

### List Items (Staggered Entrance)
```css
/* Each item staggers by 20ms */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 20ms; }
.list-item:nth-child(3) { animation-delay: 40ms; }
/* Cap at 10 items max (200ms) — beyond that, batch without stagger */
```

```typescript
// Tailwind + React pattern
const stagger = (index: number) => ({
  animationDelay: `${Math.min(index * 20, 200)}ms`,
});
```

### Page Transitions
- Outgoing: `opacity 1→0` + `translateX(0→-8px)` in `var(--duration-fast)` with `--ease-accelerate`
- Incoming: `opacity 0→1` + `translateX(8px→0)` in `var(--duration-moderate)` with `--ease-decelerate`

### Loading States
- Skeleton pulse: `opacity 0.4→0.8` alternating, `1.5s` duration, `ease-in-out`, `infinite`
- Spinner: 360° rotation, `600ms` linear, `infinite`

---

## Tailwind Implementation

```typescript
// tailwind.config.ts — extend with custom values
theme: {
  extend: {
    transitionDuration: {
      instant: '80ms',
      fast: '150ms',
      normal: '200ms',
      moderate: '300ms',
      slow: '450ms',
    },
    transitionTimingFunction: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    keyframes: {
      'fade-in': {
        from: { opacity: '0', transform: 'translateY(4px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'fade-out': {
        from: { opacity: '1', transform: 'translateY(0)' },
        to: { opacity: '0', transform: 'translateY(-4px)' },
      },
      shimmer: {
        '0%, 100%': { opacity: '0.4' },
        '50%': { opacity: '0.8' },
      },
    },
    animation: {
      'fade-in': 'fade-in var(--duration-moderate) var(--ease-decelerate) both',
      'fade-out': 'fade-out var(--duration-fast) var(--ease-accelerate) both',
      shimmer: 'shimmer 1.5s ease-in-out infinite',
    },
  },
}
```

---

## Reduced Motion

Always wrap non-critical animations:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// React hook
export function useReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

---

## Banned Patterns

- **Bounce/overshoot** — never use springs that exceed the target value
- **Long durations on utility UI** — tooltips, badges, hover states must be `fast` or `instant`
- **Simultaneous animations on 5+ elements** — use stagger or batch
- **transform + layout properties together** — `transform` is GPU-composited, `width`/`height` cause reflow
- **Animating on scroll without `will-change` or Intersection Observer** — causes jank
