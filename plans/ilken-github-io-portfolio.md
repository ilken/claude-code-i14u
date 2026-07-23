# ilken.github.io — Music-Player Portfolio

Approved plan (full version: `~/.claude/plans/we-will-build-a-enchanted-dongarra.md`).

Portfolio at https://ilken.github.io skinned as a music-streaming app (provided design): dark sidebar, cream content, lime accent. Home = music taste via live iTunes API (Linkin Park `148662`, maNga `599030056`, Duman `147491695`); tabs for Experience/Education (LinkedIn basics) and Projects (Songlio, WC26 Sweepstake, PLAI, F1 Calendar). Functional 30s preview player.

Stack: Vite + React + TS + Tailwind v4, TanStack Router + Query, ESLint flat + Prettier + simple-import-sort, yarn. Repo: reuse `ilken/ilken.github.io`, wipe history, make public, deploy via Actions → Pages.

## Checklist

- [x] Scaffold Vite react-ts in `~/Developer/ilken.github.io`, Tailwind v4, TanStack Router/Query, ESLint+Prettier+import-sort, `yarn validate`
- [x] Design tokens + brand docs (DESIGN-TOKENS.md etc.), Montserrat
- [x] App shell: Sidebar, TopBar, NowPlayingPanel, PlayerBar + file routes (/, /albums, /songs, /experience, /education, /projects)
- [x] Data layer: `lib/itunes.ts` typed fetchers + React Query hooks (staleTime Infinity), artwork upscale, duration format
- [x] Player: PlayerProvider w/ single HTMLAudioElement — queue, play/pause, next/prev, progress
- [x] Pages: Home (hero, artists row, recently played), Albums grid + filter chips, Songs list, Experience, Education, Projects
- [x] Skeletons + error fallbacks for API sections
- [x] Validate loop green (tsc, eslint, prettier, build) + manual dev check
- [x] Repo: fresh history force-push to master (via API), make public, delete main, set master as default
- [x] Deploy workflow (upload-pages-artifact → deploy-pages), Pages source = Actions, 404.html SPA fallback
- [x] Verify live site + deep links; fix Apple CDN CORS cache poisoning with `?v=1` param

## Round 2 — Animations, Hobbies & Books (2026-07-07, PR #1)

Approved plan: `~/.claude/plans/scalable-sprouting-bunny.md`. Branch `ilken/animations-hobbies-books`.

- [x] Animation set (CSS-only): nav pill scale-in, play/pause cross-fade + press, marquee (MarqueeText + ResizeObserver), skeleton shimmer, header underline reveal, hero stagger + avatar fade-in
- [x] Hobbies page `/hobbies`: football (PLAI), chess, F1 (f1-calendar) playlist cards (guitar/Encore removed — test account, not a real hobby)
- [x] Books page `/books`: Open Library ISBN covers + spine fallback; real list (My System, Fundamentals of Software Architecture, Deep Work, Atomic Habits)
- [x] Nav group additions + styled 404 notFoundComponent
- [x] Docs: MOTION-SPEC additions, README (pages + master deploy branch)
- [x] Validate + build green; usability pass via Chrome extension on `yarn preview` (nav, deep links, 404, player, seek, equalizer, marquee, chips, covers + fallback, external hrefs)
- [ ] Merge PR https://github.com/ilken/ilken.github.io/pull/1, then verify deployed site (SPA fallback deep links, covers over HTTPS, reduced-motion + mobile spot-check on a real device)
