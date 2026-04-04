# Plan: plai-agent

> Source: https://github.com/ilken/plai-agent/issues/1

## Architectural decisions

- **Container runtime**: Podman (rootless) + podman-compose. Same Dockerfile syntax as Docker.
- **Backend**: NestJS + PostgreSQL + BullMQ. 7 modules: FootballData, Betfair, Agent, Betting, Analytics, Notification, GraphQL.
- **Frontend**: Next.js. Communicates with backend via GraphQL (Apollo). Flashscore-style dark theme.
- **Betting API**: Betfair Exchange API. SSL certificate required for bot login (`certauth` endpoint).
- **Football data**: API-Football via RapidAPI (~$15/month). Provides fixtures, lineups, injuries, H2H, form, xG.
- **AI engine**: Claude API. In-context learning — each analysis prompt includes last 20 settled bet outcomes + original reasoning.
- **Agent timing**: Two-pass. 24h preliminary scan (candidate identification), 2h full analysis (confirmed lineups → pending slip).
- **Job execution**: BullMQ inside NestJS. Two queues: `preliminary-scan` and `full-analysis`. One job per fixture.
- **Secrets**: `.env` local dev only (never committed). `podman secret` for production. NestJS ConfigModule + Joi validates all vars at startup.
- **Leagues**: Premier League, La Liga, Bundesliga, Serie A, Ligue 1.
- **Bet types**: 1X2 (match result), Over/Under 2.5 goals, BTTS. LLM selects per leg.
- **ACCA legs**: 2–4 per slip. LLM decides count based on confidence across available fixtures.
- **Staking**: Base stake × confidence multiplier (low/medium/high). All values in `risk_configs` table.
- **Risk limits**: Daily max loss, weekly max loss, max stake per slip — enforced in BettingModule, configurable from web app.
- **Approval flow**: Slips created as `pending` → approved/rejected in web app → approval triggers Betfair placement.
- **Key schema**: `leagues`, `teams`, `fixtures`, `bet_slips`, `bet_legs`, `agent_runs`, `risk_configs`.

---

## Phase 1: Foundation & infrastructure

**User stories**: #12 (risk config), security requirements

### What to build

Containerized NestJS + Postgres + BullMQ stack running via Podman, with ConfigModule/Joi secret validation at boot, database migrations for all 7 schema tables, a health check endpoint, and a `RiskConfig` seeded with sensible defaults. Nothing functional yet — but the skeleton is solid, deployable, and refuses to start with missing secrets.

### Acceptance criteria

- [ ] `podman-compose up` starts NestJS, Postgres, and Redis (BullMQ) with no errors
- [ ] App refuses to boot if any required env var is missing (Joi validation)
- [ ] All 7 tables created via Prisma/TypeORM migrations
- [ ] `RiskConfig` seeded with defaults (base_stake=10, daily_max_loss=50, weekly_max_loss=150, max_stake_per_slip=30)
- [ ] `GET /health` returns 200 with service status
- [ ] `.env.example` documents all required variables
- [ ] No secrets committed to git

---

## Phase 2: Football data sync

**User stories**: #1, #13, #14

### What to build

API-Football integration that syncs leagues, teams, and upcoming fixtures for all 5 leagues. GraphQL queries exposed for leagues, teams, and fixtures. Next.js page showing upcoming fixtures with team logos, stadium info, and form badges — data flows end-to-end from API-Football through NestJS GraphQL to the UI.

### Acceptance criteria

- [ ] `FootballDataModule` syncs all 5 leagues, their teams, and next 7 days of fixtures from API-Football
- [ ] `teams.recent_form` populated as W/D/L snapshot
- [ ] GraphQL queries: `leagues`, `teams(leagueId)`, `fixtures(leagueId, from, to)` return correct data
- [ ] Next.js fixtures page renders upcoming matches with home/away team logos, kick-off time, and form badges
- [ ] Team detail shows stadium name, city, capacity, kit colours
- [ ] Sync can be triggered manually and runs without errors

---

## Phase 3: Betfair integration

**User stories**: #4 (foundational)

### What to build

Betfair SSL cert auth flow working, market lookup finding the correct event for a given fixture, and live odds fetched for 1X2 / Over2.5 / BTTS markets. Odds visible on the fixture detail page in Next.js. No betting yet — proves the Betfair connection works end-to-end.

### Acceptance criteria

- [ ] `BetfairModule` authenticates via SSL cert (`certauth` endpoint) and maintains a valid session token
- [ ] `getMarketOdds(betfairEventId, marketTypes)` returns current odds for all three market types
- [ ] Fixture detail page in Next.js displays live Betfair odds alongside team info
- [ ] Auth failure triggers a clear error log and notification — does not silently fail
- [ ] Betfair credentials stored as Podman secrets, never in code or `.env` committed to git

---

## Phase 4: Agent — preliminary scan

**User stories**: #1

### What to build

BullMQ `preliminary-scan` queue scheduling jobs 24h before each fixture. Claude API integrated and called with fixture data (form, H2H, league context). Agent identifies candidate fixtures worth full analysis, logs the full LLM prompt and response in `agent_runs`. A simple admin view in Next.js shows recent agent runs. No bet slip created yet — proves the LLM analysis loop is working.

### Acceptance criteria

- [ ] `preliminary-scan` jobs are enqueued automatically for all fixtures within the next 24–48h window
- [ ] Claude API called with structured fixture context (form, league, H2H summary)
- [ ] `AgentRun` record created per fixture with `run_type: preliminary`, full `llm_prompt`, `llm_response`, and `status`
- [ ] Failed jobs retry up to 3 times before marking `status: failed`
- [ ] Admin view in Next.js lists recent `AgentRun` records with status and truncated reasoning

---

## Phase 5: Agent — full analysis + pending slip

**User stories**: #2, #3, #6, #7, #8, #9

### What to build

`full-analysis` queue fires 2h before kick-off with confirmed lineups and injury data. Claude constructs a 2–4 leg ACCA, assigns confidence, and the system creates a `BetSlip` + `BetLeg` records in `pending` state with per-leg LLM reasoning. Risk limits are enforced before creation. Email notification sent. Pending slip with full reasoning visible and reviewable in the web app.

### Acceptance criteria

- [ ] `full-analysis` job runs ~2h before kick-off and fetches confirmed lineups + injuries from API-Football
- [ ] LLM prompt includes: fixture details, lineups, injuries, form, H2H, current Betfair odds, and last 20 settled bet legs with outcomes
- [ ] `BetSlip` created with `status: pending`, `confidence`, `total_stake` (base × multiplier), and `llm_reasoning`
- [ ] Each `BetLeg` has `market_type`, `selection`, `odds`, `llm_confidence`, and `llm_reasoning`
- [ ] Risk limits checked before slip creation — agent skips placement if daily/weekly limit would be exceeded
- [ ] Email notification sent when a new pending slip is created
- [ ] Pending slip visible in web app with full per-leg reasoning and confidence indicators

---

## Phase 6: Approval flow + Betfair placement

**User stories**: #3, #4, #5

### What to build

Approve and reject actions in the web app on any pending slip. Approval calls `approveBetSlip` mutation → `BettingModule` calls `BetfairModule.placeAccaBet` → `betfair_bet_ref` stored, status transitions to `placed`. Rejection sets `status: rejected` and records it. Complete human-in-the-loop cycle working end-to-end.

### Acceptance criteria

- [ ] Approve button on pending slip calls `approveBetSlip(id)` mutation
- [ ] Approval triggers `BetfairModule.placeAccaBet` with correct legs and stake
- [ ] `BetSlip.betfair_bet_ref` populated and `status` transitions to `placed` on success
- [ ] Betfair placement failure rolls status back to `approved` (not `placed`) and sends notification
- [ ] Reject button sets `status: rejected` — slip remains visible in history
- [ ] Placed bet visible in bet slip list with status badge

---

## Phase 7: Settlement + learning loop

**User stories**: #6, #11

### What to build

Scheduled Betfair result polling after each fixture finishes. Bet legs settled as `won`/`lost`/`void`, slip settled with `actual_return` calculated. Outcome history (including original LLM reasoning and confidence) fed back into the full-analysis prompt so future analyses reflect past mistakes. Settled slip detail page shows per-leg outcome against LLM confidence.

### Acceptance criteria

- [ ] Betfair result polling runs after each fixture's expected finish time
- [ ] Each `BetLeg` outcome updated to `won`, `lost`, or `void` based on Betfair settlement
- [ ] `BetSlip.actual_return` calculated and `settled_at` timestamp set
- [ ] Future `full-analysis` prompts include rolling summary of last 20 settled legs with outcomes and original reasoning
- [ ] Settled slip detail page shows per-leg: selection, odds, outcome, LLM confidence, and LLM reasoning
- [ ] Notification sent on slip settlement

---

## Phase 8: Analytics dashboard

**User stories**: #10, #11

### What to build

Flashscore-style analytics dashboard: all-time ROI, monthly win rate, per-league breakdown, and confidence calibration (does high-confidence actually win more?). `AnalyticsModule` powers all queries. The full product is complete and the data tells a story.

### Acceptance criteria

- [ ] `allTimeStats` query returns: total bets, win rate, ROI, total staked, total returned
- [ ] `monthlyStats(month)` returns same breakdown for a given calendar month
- [ ] `leagueBreakdown` returns win rate and ROI per league
- [ ] Confidence calibration view shows win rate split by low/medium/high confidence
- [ ] Dashboard renders all stats with Flashscore-style dark theme and clear visual hierarchy
- [ ] All stats update correctly as new slips settle
