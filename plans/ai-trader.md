# ai-trader — Implementation Plan

## Confirmed Decisions

| Decision | Choice |
|---|---|
| Execution | Paper trade first, real money Phase 2 |
| Market | Polymarket only (CLOB on Polygon) |
| Trading currency | USDC on Polygon + small POL for gas |
| Backend | NestJS (TypeScript) |
| Frontend | Next.js (TypeScript) |
| Monorepo | Turborepo |
| ML Engine | Claude API (6-stage scoring pipeline) |
| Database | PostgreSQL + Prisma |
| VIX data | Alpha Vantage (free tier) |
| Fear & Greed | alternative.me API (free) |
| Sentiment | NewsAPI + Claude scoring |
| Polymarket data | CLOB REST API + WebSocket |

---

## Repo Structure

```
ai-trader/
  apps/
    engine/               # NestJS trading engine
      src/
        data-ingestion/   # Market data feeds
        analytics/        # Claude scoring pipeline
        risk-manager/     # Position limits, drawdown
        execution/        # Paper + real order execution
        portfolio/        # P&L tracking
        signals/          # Active signal management
        backtesting/      # Historical simulation (Phase 2)
      prisma/
        schema.prisma
    dashboard/            # Next.js terminal UI
      src/
        app/
        components/
          TopBar/         # F&G, VIX, ML Confidence, Drawdown, P&L
          PredictionMarkets/  # Left panel
          ActiveSignals/
          PLChart/        # Centre chart
          SystemArchitecture/ # Right panel
          StatusBars/     # Bottom module status
          SystemLogs/     # Bottom log feed
          Positions/
          Orders/
  packages/
    shared/               # Shared TypeScript types
      src/
        types/
          market.ts       # Market, Position, Order types
          signal.ts       # Signal types
          scoring.ts      # Claude scoring response types
          system.ts       # Module health/status types
  docker-compose.yml      # PostgreSQL + engine + dashboard
  .env.example
  turbo.json
```

---

## Phase 1 — Foundation + Paper Trading

**Goal:** Full system running end-to-end with paper execution. Dashboard live. Claude scoring markets. P&L tracking.

### 1.1 Monorepo Scaffold
- Init Turborepo with `apps/engine`, `apps/dashboard`, `packages/shared`
- Configure `turbo.json` build pipeline (build, dev, lint, typecheck)
- Root `package.json` with workspaces
- Shared ESLint + TypeScript configs
- Docker Compose: PostgreSQL service
- `.env.example` with all required keys documented

### 1.2 Prisma Schema
```prisma
Market          # Polymarket market (question, end date, outcomes)
Position        # Open/closed positions (market, size, entry price, PnL)
Order           # Individual orders (market, side, price, size, status)
Signal          # Generated trading signals (market, direction, confidence, reasoning)
ScoreHistory    # Claude scoring log (input context, output score, timestamp)
PnlSnapshot     # Hourly P&L snapshots for the chart
SystemLog       # Real-time system log entries (EXEC/RISK/ML/SIG tags)
```

### 1.3 NestJS Engine — DataIngestion Module
Four scheduled services, each polling on an interval:

- **PolymarketService** — WebSocket connection to CLOB for real-time order book + REST poll for active markets list. Stores markets in DB.
- **VixService** — Polls Alpha Vantage every 5 min for VIX spot value. Stores latest reading.
- **FearGreedService** — Polls alternative.me every 15 min. Returns score 0-100 + classification (Extreme Fear → Extreme Greed).
- **SentimentService** — Polls NewsAPI every 30 min for financial headlines → sends to Claude for sentiment scoring (-1.0 to +1.0). Returns score + summary.

All services emit events via NestJS `EventEmitter` so the AnalyticsEngine reacts to new data.

### 1.4 NestJS Engine — AnalyticsEngine Module (Claude Scoring)
Six-stage pipeline triggered when fresh data arrives:

```
Stage 1 — Feature Extraction
  Input:  Raw market data (current odds, volume, time-to-expiry)
  Output: Structured feature object (implied probability, liquidity score, momentum)

Stage 2 — Macro Context
  Input:  VIX value, Fear & Greed score, classification
  Output: Market regime assessment (risk-on / risk-off / neutral)

Stage 3 — Sentiment Overlay
  Input:  NewsAPI headlines + Claude sentiment score
  Output: Directional sentiment per market category

Stage 4 — Probability Gap Analysis
  Input:  Polymarket implied probability vs Claude's estimated fair probability
  Output: Edge score (-1.0 to +1.0), direction (YES/NO/SKIP)

Stage 5 — Regime Detection
  Input:  Recent P&L history, win rate, drawdown
  Output: Strategy regime (Trend / Mean-Revert / Cautious / Halt)

Stage 6 — Final Decision
  Input:  All above stages
  Output: {
    confidence: number,       // 0-100
    direction: 'YES'|'NO'|'SKIP',
    sizing: number,           // Kelly fraction (0-1)
    reasoning: string,        // Human-readable explanation
    riskFlags: string[]       // Any concerns flagged
  }
```

Claude is called once per market per cycle with a structured prompt containing all stage inputs. Response is parsed, validated, and stored as a `Signal`.

### 1.5 NestJS Engine — RiskManager Module
Runs before every order is sent to execution:

- **Position limit check** — Max position size per market (configurable, default $100 paper)
- **Drawdown check** — If portfolio drawdown > limit (default 5%), halt new trades
- **Exposure check** — Max % of portfolio in any single market category
- **Confidence gate** — Only trade if Claude confidence > threshold (default 70%)
- Returns `PASS` | `FAIL` with reason. Logs to `SystemLog`.

### 1.6 NestJS Engine — ExecutionEngine Module (Paper Mode)
- `PaperExecutionService` — Simulates order fills at current Polymarket mid price
- Creates `Order` and `Position` records in DB
- Emits fill events to Portfolio module
- Flag `PAPER_MODE=true` in `.env` — swapping to real execution in Phase 2 requires only changing this flag and activating the real service

### 1.7 NestJS Engine — Portfolio Module
- Tracks open positions, realised + unrealised P&L
- Takes hourly `PnlSnapshot` for chart history
- Calculates: total P&L today, total P&L all-time, Sharpe ratio, win rate, avg trade size, max drawdown
- Exposes all metrics via REST + WebSocket

### 1.8 NestJS Engine — WebSocket Gateway
- Single WebSocket namespace `/live`
- Broadcasts on events: `pnl.update`, `signal.new`, `order.filled`, `system.log`, `module.status`
- Dashboard subscribes to these channels for real-time updates

### 1.9 Next.js Dashboard — Terminal UI
Exact visual match to the provided screenshots. Dark terminal aesthetic:

**Design tokens:**
- Background: `#0a0a0a`
- Primary accent: `#00ff88` (neon green)
- Warning: `#ff8c00` (orange)
- Danger: `#ff3333` (red)
- Text primary: `#e0e0e0`
- Text muted: `#666`
- Font: JetBrains Mono (monospace throughout)
- Grid-based layout, no rounded corners, minimal borders

**Components:**
- `TopBar` — Fear & Greed, VIX, Poly Vol 24h, ML Confidence, Drawdown, P&L Today. Updates live via WebSocket.
- `PredictionMarkets` — Left panel. List of active Polymarket markets with implied probability + Fear/Greed label. Colour-coded green/red.
- `ActiveSignals` — Below prediction markets. Shows current open signals with direction badge (LONG/SHORT/WATCH) + confidence %.
- `PLChart` — Centre. Area chart of P&L over time. Green fill. Lightweight-charts library (TradingView). Real-time tick updates.
- `FearGreedGauge` — Semicircular gauge overlaid on chart. Animated needle. Colour gradient Fear (red) → Greed (green).
- `SystemArchitecture` — Right panel. Six module cards (Data Ingestion, Analytics Engine, Risk Manager, Execution Engine, Backtesting, Dashboard). Each shows: status dot, sub-components, key metric.
- `StatusBars` — Bottom. Six columns matching the six modules. Each column has 4 metrics with a small progress bar. Updated live.
- `SystemLogs` — Bottom right. Scrolling log feed. Each entry tagged: EXEC / RISK / ML / SIG. Colour coded. Auto-scrolls.
- `PositionsTable` — Tab panel. Open positions with entry price, current price, unrealised P&L.
- `OrdersTable` — Tab panel. Recent orders with status, fill price, latency.

### 1.10 Phase 1 Deliverables Checklist
- [ ] Monorepo running with `pnpm dev` (engine + dashboard hot reload)
- [ ] PostgreSQL seeded with Polymarket market list
- [ ] All four data feeds ingesting and logging
- [ ] Claude scoring pipeline producing signals
- [ ] Paper orders executing on signals that pass risk checks
- [ ] Dashboard displaying live data via WebSocket
- [ ] P&L chart updating in real time
- [ ] System logs streaming to dashboard

---

## Phase 2 — Real Execution + Risk Hardening + Backtesting

**Goal:** Flip from paper to real money safely. Harden risk controls. Validate strategy with 2yr backtest.

### 2.1 Wallet Integration
- `WalletService` in ExecutionEngine — loads private key from `.env`, constructs Polygon signer
- USDC balance check on startup — warns if below minimum trading threshold
- POL balance check — warns if too low for gas
- All key handling in server-side env only, never exposed to dashboard

### 2.2 Real Execution via Polymarket CLOB
- `PolymarketExecutionService` — wraps `@polymarket/clob-client`
- Submits limit orders at calculated entry price (with slippage tolerance from RiskManager)
- Polls for fill confirmation, updates `Order` status
- Handles partial fills, cancellations, expiries
- Measures order latency — logged to SystemLog (matches "30ms" shown in screenshot)
- `PAPER_MODE=false` in `.env` activates this service, paper service deactivates

### 2.3 Risk Manager Hardening
New controls added on top of Phase 1 basics:
- **Kelly Criterion sizing** — Position size = (edge × odds) / odds. Fractional Kelly (0.25×) for safety.
- **Slippage limit** — Cancel order if expected slippage > 0.5% (configurable)
- **Max concurrent positions** — Hard cap on number of open positions
- **Category concentration** — No more than X% in one market category (e.g., crypto, politics)
- **Daily loss limit** — Halt all trading if day's P&L drops below threshold
- **Circuit breaker** — Three consecutive losses → pause for 1 hour, notify

### 2.4 Backtesting Engine
- `BacktestingService` — fetches historical Polymarket resolution data (2yr via their API)
- Replays signals against historical odds — simulates what Claude would have scored
- Calculates: Sharpe ratio, win rate, max drawdown, avg trade P&L, total return
- Results displayed in dashboard `Backtesting` module card (matches "2.14 Sharpe, 67% win rate" in screenshot)
- Configurable date range, can be re-run from dashboard

### 2.5 Strategy Configuration UI
- Settings panel in dashboard (gear icon)
- Configurable params: confidence threshold, max drawdown, position size, Kelly fraction, data feed toggles
- Changes update `.env` or DB config table — engine picks up on next cycle
- "Positions Hidden" privacy mode toggle (matches screenshot)

### 2.6 Phase 2 Deliverables Checklist
- [ ] Wallet connected, USDC/POL balance shown in dashboard
- [ ] Real orders executing on Polymarket CLOB
- [ ] Fill latency < 50ms shown in execution status
- [ ] Kelly sizing working, position sizes match risk params
- [ ] Backtesting engine returning 2yr Sharpe + win rate
- [ ] Circuit breaker halting trading on drawdown breach
- [ ] Strategy config panel working

---

## Phase 3 — Automation + Intelligence

**Goal:** System runs autonomously. Finds opportunities itself. Optimises over time.

### 3.1 Automated Market Scanner
- Background job scans all active Polymarket markets every 5 min
- Filters by: liquidity threshold, time-to-expiry window, category allowlist
- Surfaces top N opportunities ranked by Claude confidence score
- Adds to Active Signals queue automatically

### 3.2 Multi-Strategy Support
- Strategy abstraction layer — define multiple named strategies with different params
- Each strategy has: market filter, Claude prompt variant, risk profile, sizing rules
- Run strategies in parallel, portfolio-level risk still applies
- Strategy performance tracked independently

### 3.3 Advanced Portfolio Analytics
- Full Sharpe / Sortino / Calmar ratio calculations
- Rolling win rate (7d, 30d, all-time)
- P&L attribution by market category
- Best/worst trades breakdown
- Equity curve with drawdown overlay

### 3.4 Notifications
- Slack webhook integration (reuse existing `/post-slack` skill)
- Notify on: large fill, drawdown breach, circuit breaker trigger, daily P&L milestone
- Daily summary message at market close

### 3.5 Position Management
- Partial take-profit logic — close 50% at target, let rest run
- Dynamic stop-loss based on market volatility
- Time-based exit — close positions N hours before expiry if unresolved

### 3.6 Phase 3 Deliverables Checklist
- [ ] Scanner running autonomously, no manual market selection needed
- [ ] Two or more strategies running in parallel
- [ ] Full analytics dashboard with all performance metrics
- [ ] Slack notifications on key events
- [ ] Partial TP + dynamic stops working

---

## Environment Variables

```env
# Polymarket
POLYMARKET_PRIVATE_KEY=0x...
POLYMARKET_API_KEY=...
POLYMARKET_API_SECRET=...
POLYMARKET_API_PASSPHRASE=...

# Claude
ANTHROPIC_API_KEY=...

# Data feeds
ALPHA_VANTAGE_API_KEY=...
NEWS_API_KEY=...

# Database
DATABASE_URL=postgresql://...

# Trading config
PAPER_MODE=true
MAX_POSITION_SIZE_USD=100
MAX_DRAWDOWN_PCT=5
MIN_CONFIDENCE_THRESHOLD=70
KELLY_FRACTION=0.25

# Dashboard
NEXT_PUBLIC_ENGINE_WS_URL=ws://localhost:3001
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + yarn workspaces |
| Engine | NestJS + TypeScript |
| Dashboard | Next.js 14 + TypeScript |
| Database | PostgreSQL + Prisma |
| Charts | Lightweight-charts (TradingView) |
| Real-time | WebSocket (NestJS Gateway + Next.js client) |
| ML/Scoring | Claude API (claude-sonnet-4-6) |
| Execution | @polymarket/clob-client |
| Styling | Tailwind CSS (terminal dark theme) |
| Fonts | JetBrains Mono |
| Containerisation | Docker Compose |
