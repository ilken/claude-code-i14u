# Minechester Revival — Web Rebuild

## Context

Minechester is a 2014 Windows 8 (WinJS + jQuery) Minesweeper game built in Manchester — repo: https://github.com/ilken/Minechester. The Windows 8 platform is dead but the game logic is pure web tech, so we're rebuilding it as a modern web app in a **new repo** (`~/Developer/minechester`, GitHub `ilken/minechester`), keeping every feature: classic single-player (Easy/Medium/Pro), local 2-player multiplayer, Challenge AI with difficulties, hexagonal mode, tutorial, high scores, achievements, and themes. Storage moves from `Windows.Storage.ApplicationData` to versioned localStorage.

**Stack** (same as boulevard-dex): Vite + React 19 + TypeScript + Tailwind v4 + TanStack Router, yarn v1, ESLint flat + simple-import-sort + Prettier, GitHub Pages deploy. Original repo cloned for reference at `/private/tmp/claude-501/-Users-ilken-Developer-claude-code-i14u/6afcc4ee-2966-49bb-a606-0fff10afb326/scratchpad/Minechester`.

**User decisions:**
- Visual: **Metro, modernised** — flat-tile Metro identity (start-screen tile grid home, bold type) with a refined modern palette, contrast, subtle motion, responsive layout.
- Boards: **keep originals** — Easy 10×10/5, Medium 12×12/20, Pro 16×16/40, Versus (multi + AI) 20×20/99, Hex 17×17/40.
- AI: **fair and finished** — no peeking at hidden cells; implement the never-finished BestGuess properly.
- Themes: **proper theme system** — named persisted board colourways (Classic, Manchester, London, Cyprus) replacing the old palette pickers + photo galleries.
- **All game/AI logic in plain TS classes, fully separate from React components** (explicit user requirement).

## Original game rules to preserve (extracted from source)

**Classic (easy/medium/pro + hex):**
- Left-click reveal; right-click flag (decrements mine counter, floor 0); flags block reveal.
- Empty cell → flood-fill reveal of neighbours. Click on a revealed number whose flagged-neighbour count equals its number → chord-reveals remaining hidden neighbours.
- Hit mine → reveal whole board, game over. Win when hidden count == mine count.
- Timer starts on first move, hundredths precision; best time saved per mode (lower is better), plus gamesPlayed/won/lost per mode and totalGamesPlayed.
- Solver button ("watch it play"): StraightForward (flag when hidden==remaining mines; reveal when flags==number) → MultiBox → BestGuess. Solver games tracked as separate stats (`AIEasy`/`AIMedium`/`AIPro`), not player stats.

**Versus (multiplayer & Challenge AI), 20×20/99, turn-based scoring:**
- Reveal number = +100 × mineCount; empty flood = +100 per empty and +100×count per number revealed in the cascade; correct flag = +500; wrong flag = −500, flag removed, **lose turn**; reveal mine = −100, mine stays revealed, counter −1, **lose turn**. Score floor 0.
- Game ends when every cell is revealed or flagged and mine counter is 0; higher score wins; tie = "Noob Draw".
- Challenge AI: player 2 is the algorithm; AI takes moves (with a short thinking delay) until it makes a turn-losing move. Difficulties — Easy: constraint moves else random guess; Pro: constraint moves else probability-based BestGuess. Stats: AI games played, player wins, AI wins, best time. (Rebuild adds no cheating — original Pro read hidden cell state.)

**Hexagonal:** 17×17 offset hex grid, 40 mines, 6 neighbours with odd/even-row offset logic (see `pages/hexagonal/hexagonal.js:346`), otherwise classic rules; own stats bucket (`hex`).

**Achievements (8, derived from stats):** Win 100 Easy / 100 Medium / 100 Pro / 100 Hexagonal games; Play 100 games (total); Win 100 games using Solver; Beat AI 10 times; Play 100 Multiplayer games. Shown as progress `n/target`.

**High Scores page:** per-mode best time + played/won/lost for easy, medium, pro, hex, versus-AI; plus solver stats section.

## Architecture

```
minechester/
  src/
    engine/            # pure TS, zero React imports — unit-tested
      types.ts         # Cell, GridPos, GameStatus, ModeConfig, events
      grid.ts          # Grid topology interface + SquareGrid (8-neighbour) + HexGrid (6-neighbour, odd/even row offsets)
      board.ts         # Board class: plant mines, counts, reveal/flood/chord, flag, win/lose detection — emits events, no DOM
      classic-game.ts  # ClassicGame: timer state, mine counter, status, wraps Board
      versus-game.ts   # VersusGame: turn/score rules above, wraps Board
      solver.ts        # Solver: straightForward, multiBox, bestGuess (real probability estimate) — returns moves, doesn't execute
      ai-player.ts     # AiPlayer: difficulty (easy/pro) → picks next move via Solver, no hidden-state access
      modes.ts         # board configs: easy 10×10/5, medium 12×12/20, pro 16×16/40, versus 20×20/99, hex 17×17/40
    storage/           # versioned localStorage, boulevard-dex store pattern (cross-tab sync)
      stats-store.ts   # per-mode best time + counters, solver stats, totalGamesPlayed
      settings-store.ts# active theme
      achievements.ts  # definitions + progress derived from stats
    hooks/             # use-classic-game, use-versus-game, use-stats, use-theme, use-reduced-motion
    components/        # BoardGrid (square), HexBoardGrid, Cell, Hud (timer/mine counter/new game/solver btn), ScorePanel, SolverLog, MetroTile, NavBar
    routes/            # TanStack Router
      index            # Metro start-screen tile grid (Classic / Modern / Extras groups, like original home)
      play.$mode       # easy | medium | pro
      multiplayer, challenge-ai, hexagonal
      high-scores, achievements, tutorial, settings (theme picker)
  BRAND-VOICE.md DESIGN-TOKENS.md MOTION-SPEC.md
```

Themes = CSS custom-property sets applied to board cells (hidden/empty/number/flag/mine colours): Classic (original purple/black), Manchester, London, Cyprus colourways. Persisted in settings-store.

## Steps

- [x] Scaffold new repo `~/Developer/minechester` (vite react-ts, TanStack Router plugin, Tailwind v4, eslint flat + simple-import-sort, prettier, vitest, `yarn validate` = lint + typecheck + test + build), git init + GitHub repo `ilken/minechester`
- [x] Brand docs (BRAND-VOICE, DESIGN-TOKENS, MOTION-SPEC) — Metro-modernised tokens, `@theme` in Tailwind, favicon (mine glyph)
- [x] Engine: types, grids (square + hex), Board with reveal/flood/chord/flag/win — **with vitest unit tests** (deterministic via injectable RNG/mine placement)
- [x] Engine: ClassicGame + VersusGame scoring rules — unit tests for every scoring case above
- [x] Engine: Solver (straightForward, multiBox, bestGuess probability) + AiPlayer difficulties — tests: solver never reads unrevealed mine state except via probabilities
- [x] Storage: versioned stats/settings stores + achievements derivation (port all original stat keys' semantics)
- [x] UI: BoardGrid + Cell + Hud, classic play route (all 3 modes), solver "watch it play" with move animation + log
- [x] UI: versus routes — multiplayer (hot-seat) + challenge-ai (difficulty select, turn indicator, animated score deltas)
- [x] UI: hexagonal route (CSS hex grid)
- [x] UI: home tile grid, high scores, achievements, tutorial (rewritten for web controls), settings/theme picker
- [x] Mobile support: long-press to flag, responsive board sizing
- [x] Browser-verify every mode end-to-end (win, lose, flags, chord, solver, AI turns, persistence across reload, 375px)
- [x] Deploy: GitHub Pages workflow, repo `ilken/minechester-reborn`, PR #1 open
- [x] Merge PR + verify live URL + SPA deep links
- [x] Copy this plan to `~/Developer/claude-code-i14u/plans/minechester-revival.md` per RALF convention

## Verification

- `yarn validate` clean (lint, typecheck, vitest, build).
- Engine tests cover: flood fill, chord, win/lose detection, hex neighbours (odd/even rows), all versus scoring branches, solver correctness on crafted boards.
- Browser (claude-in-chrome): play each mode to win and to loss; verify timer/best-time persistence, achievements progress, theme switching persists, AI plays legally and loses turn correctly; mobile 375px; no console errors.
- Live: GitHub Pages URL + deep link to a game route.

## Out of scope (v1)

- Online multiplayer (original was local hot-seat only)
- Photo galleries from the old Themes section
- Custom board sizes
