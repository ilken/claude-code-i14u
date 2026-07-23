# Boulevard Dex — Hot Wheels Boulevard Collection Tracker

Approved plan: `~/.claude/plans/we-would-like-to-wise-bengio.md`

Pokédex-style tracker for the Hot Wheels Boulevard reboot — the only HW premium line with
continuous cross-year numbering (#001–#155, 2020–2026). Boulevard night-neon brand (asphalt navy,
neon amber/pink/cyan, Montserrat + Yellowtail wordmark). Dex data hardcoded; collection + profile
in versioned localStorage (trading-ready schema).

Stack: Vite + React 19 + TS + Tailwind v4 + TanStack Router, yarn v1, GitHub Pages.

Repo: https://github.com/ilken/boulevard-dex · Live: https://ilken.github.io/boulevard-dex/

## Checklist

- [x] Scaffold (vite react-ts, router plugin, tailwind v4, eslint flat + simple-import-sort, prettier, `yarn validate`)
- [x] Brand docs (BRAND-VOICE, DESIGN-TOKENS, MOTION-SPEC) + night-neon `@theme` tokens + favicon
- [x] Data layer: 150-car dataset with bodyType/make, derived slugs, build-load integrity assertions
- [x] localStorage stores (versioned, cross-tab sync) + use-collection/use-profile/use-stats/use-reduced-motion/use-odometer
- [x] Shared components: CarImage with silhouette fallback (6 body types), NavBar (top bar / mobile tabs), neon Wordmark
- [x] Screens: dex grid (URL-param filters, odometer stats, progress-bar car, year chips), My Garage (renamed from Checklist), car detail, profile + avatar picker
- [x] Motion inventory per spec, reduced-motion safe
- [x] Images: all 150 photos via Fandom MediaWiki API (`scripts/fetch-images.mjs`, webp)
- [x] Browser-verified: routing, toggles, mint⇒owned, persistence, mobile 375px, search, no console errors
- [x] Deploy: repo + Pages workflow (yarn v1), PR #1 merged
- [x] Verify live URL + SPA deep link
- [x] 2026 Mix C (#151–155) + Owner's Garage preset toggle (PR #2)

## Later (out of scope for v1)

- Trading features (schema v2: forTrade/wishlist fields via storage migration)
- Export/import collection JSON
- "New mix" badge when 2026 Mix D–E land (Mix C added in PR #2)
