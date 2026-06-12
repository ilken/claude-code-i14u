# Brand Voice

> **Instructions**: Fill in each section below before building any UI. This file is the creative brief Claude reads before making any aesthetic decision. Be specific — vague guidance produces generic output.

---

## Creative Analogy

> Describe the product's feel in one vivid, concrete sentence. Avoid abstract adjectives. The analogy should make typography, color, and motion decisions self-evident.

**This product should feel like:**
`[FILL IN — e.g., "A high-end Swiss watch: precise, mechanical, monochromatic, with high-contrast emergency-orange accents for interactive elements." or "A well-worn leather notebook from a Tokyo stationery shop: warm off-whites, ink-black text, tactile texture, unhurried."]`

---

## Personality Spectrum

Rate the product on each axis (circle or bold the position):

| Axis | ← | Center | → |
|------|---|--------|---|
| Serious ←→ Playful | `[ ]` | `[ ]` | `[ ]` |
| Minimal ←→ Expressive | `[ ]` | `[ ]` | `[ ]` |
| Warm ←→ Cool | `[ ]` | `[ ]` | `[ ]` |
| Corporate ←→ Human | `[ ]` | `[ ]` | `[ ]` |
| Dense ←→ Airy | `[ ]` | `[ ]` | `[ ]` |

---

## Typography Rules

**Display font** (headings, hero text):
`[FILL IN — e.g., "Fraunces", "Playfair Display", "Clash Display", "Cabinet Grotesk"]`

**Body font** (paragraphs, UI text):
`[FILL IN — e.g., "DM Mono", "Geist Mono", "IBM Plex Sans", "Syne"]`

**Explicitly banned fonts** (do not use under any circumstances):
`Inter, Roboto, Arial, Helvetica, Lato, Open Sans, Source Sans Pro`

**Why banned**: These fonts signal "I let an AI pick" or "default Bootstrap". The product deserves a distinct voice.

**Size scale**: Use the design token scale defined in `DESIGN-TOKENS.md`. Never hardcode `px` sizes.

---

## Tone of Voice (Copy)

**One-word summary**: `[e.g., Confident / Calm / Irreverent / Precise]`

**Write like**: `[e.g., "A senior engineer explaining something clearly, without condescension."]`

**Never write like**: `[e.g., "Marketing copy. Exclamation points. Vague superlatives."]`

**UI microcopy examples**:
- Empty state: `[e.g., "Nothing here yet." not "Wow, it's empty! Get started by..."]`
- Error message: `[e.g., "Couldn't load data. Try again." not "Oops! Something went wrong 😬"]`
- CTA: `[e.g., "Get started" not "Start your journey today!"]`

---

## Visual Don'ts

List specific things to never do in this product's UI:

- `[e.g., No AI purple/pink gradients]`
- `[e.g., No glassmorphism for primary surfaces — only for overlays]`
- `[e.g., No emoji as icons — use Lucide or Heroicons SVGs]`
- `[e.g., No drop shadows on text]`
- `[e.g., No more than 2 font weights per component]`

---

## Inspiration References

Products/sites whose aesthetic this should borrow from:
- `[e.g., linear.app — for the dark, precise, monochromatic UI]`
- `[e.g., stripe.com — for the typography hierarchy]`
- `[e.g., basement.studio — for the editorial boldness]`
