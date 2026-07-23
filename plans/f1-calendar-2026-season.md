# f1-calendar: 2026 Season Update + Ferrari Polish

Status: ✅ shipped — PR https://github.com/ilken/f1-calendar/pull/7 (branch `ilken/2026-calendar`)

## Context

App showed the stale 2025 season. Updated to the real 2026 calendar — **22 rounds** (Bahrain and Saudi Arabia cancelled mid-2026 due to regional instability; Madrid/Madring added, Imola dropped) — with Ferrari theming and race-weekend features. 2027 deferred until F1 publishes the official calendar (expected soon; Portugal and Turkey confirmed returning, Zandvoort out, Barcelona rotating out).

## Checklist

- [x] Rewrite `src/data/calendar.data.ts`: 22 races, ISO UTC dates (Jolpica API), `isSprint`/`circuit`/`location`, verified f1.com URLs
- [x] `src/lib/season.ts` helpers: next race, finished/live status, start-light thresholds
- [x] `public/images/madrid.avif` from F1's official Madring track map (960×720, matches existing style)
- [x] Ferrari theme: rosso corsa `#ff2800` + giallo `#ffd800`; 2026 metadata, README
- [x] Start-lights countdown gantry + lights-out state (also fixed <24h skeleton bug)
- [x] `SeasonProgress` track with Ferrari car marker; finished/live/next card states
- [x] `.ics` export per race + full season (`src/lib/ics.ts`, no deps)
- [x] Sprint badges, circuit info line, hover sheen, `prefers-reduced-motion` support
- [x] Fixed pre-existing timezone-label hydration mismatch (tzdata differs server vs browser)
- [x] 45 tests / 6 suites green; lint + type-check + build clean; browser-verified

## Follow-ups

- [ ] Add 2027 season once the official calendar is announced (data model unchanged; just a new array + season switcher decision)
- [ ] If Bahrain is reinstated for Oct 4, 2026 (decision due before the July 26 summer break), update the calendar
