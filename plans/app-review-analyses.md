# Plan: App Review Analysis Platform

> Source: Brainstorm session — product teams paste app store URLs to get AI-powered review categorisation, reports, and competitor analysis.

## Architectural decisions

- **Monorepo structure**: `apps/web` (Next.js App Router) + `apps/api` (NestJS)
- **Auth**: BetterAuth — Google OAuth + email, `users.role: user | admin`
- **Queue**: BullMQ + Redis for async report generation jobs
- **AI**: Claude API — review classification (18 categories), report narrative, chart data, roadmap suggestions, competitor diff
- **Scraping**: `app-store-scraper` (App Store), `google-play-scraper` (Google Play), Playwright (Trustpilot)
- **Payments**: Stripe one-time — $29 full report, $49 full + competitors (up to 3)
- **Package manager**: Yarn
- **Infra**: Podman (local) → Railway (prod)

## Schema (key models)

- `users` — id, email, role (user | admin), created_at
- `apps` — id, app_store_id, play_store_id, trustpilot_slug, name, icon_url (canonical, shared across users)
- `products` — id, user_id → users, app_id → apps, created_at
- `reviews` — id, app_id → apps, source (appstore | googleplay | trustpilot), rating, body, reviewed_at, scraped_at
- `review_analyses` — id, review_id → reviews, category (18 categories enum), sentiment (positive | neutral | negative), score
- `reports` — id, product_id → products, status (pending | processing | done | failed), tier (free | full | full_with_competitors), unlocked (bool), chart_data (JSON), roadmap_items (JSON), narrative (text), competitor_diff (JSON), created_at

## Routes

- `POST /api/apps/submit` — submit URLs, create product, queue job
- `GET /api/reports/:productId` — fetch report (gated by tier)
- `POST /api/payments/checkout` — create Stripe checkout session
- `POST /api/payments/webhook` — Stripe webhook, unlock report
- `GET /api/admin/reports` — admin only, all reports + search
- `/` — landing page (SEO)
- `/report/:productId` — report page (partial free, gated full)
- `/admin` — admin dashboard

## 18 Review Categories

UI/UX & Design, Performance & Speed, Stability & Crashes, Features & Functionality, Feature Requests, Onboarding & Setup, Pricing & Value, Ads & Monetisation, Subscription & Billing, Customer Support, Privacy & Security, Account & Login, Notifications & Alerts, Personalisation, Integrations & Compatibility, Competitor Mentions, Positive Praise, General Sentiment

---

## Phase 1: Scaffold & Auth

**User stories**: Developer sets up project, user can sign up and log in

### What to build

Initialise the monorepo with Next.js (App Router) and NestJS, wire up BetterAuth with Google OAuth and email, create the Prisma schema with users + roles, set up Podman compose (Next.js, NestJS, PostgreSQL, Redis), and add Railway deploy config.

### Acceptance criteria

- [ ] Monorepo boots with `podman-compose up`
- [ ] User can sign up and log in via Google OAuth and email
- [ ] `users.role` field exists (user | admin), default `user`
- [ ] Prisma migrations run cleanly
- [ ] Railway deploy config (railway.toml or Dockerfiles) present
- [ ] Protected route returns 401 for unauthenticated requests

---

## Phase 2: Submit & Scrape

**User stories**: User pastes app URLs, system ingests reviews

### What to build

Build the URL submission form (Next.js), NestJS endpoint that parses app IDs from URLs, creates `apps` + `products` records, queues a BullMQ scraping job, scrapes App Store + Google Play + Trustpilot, deduplicates reviews by app ID, stores raw reviews. UI shows "processing" state while job runs.

### Acceptance criteria

- [ ] User submits App Store URL, Google Play URL, and Trustpilot URL
- [ ] App IDs extracted and stored in `apps` table
- [ ] Duplicate apps reuse existing records (deduplication)
- [ ] BullMQ job created and processed
- [ ] Reviews stored in `reviews` table with correct source tags
- [ ] UI polls and shows processing → done state transition

---

## Phase 3: AI Analysis Pipeline

**User stories**: Reviews are classified and a report is generated

### What to build

NestJS service that sends reviews to Claude API for classification into 18 categories + sentiment, stores results in `review_analyses`, then calls Claude to generate report narrative, chart data JSON, and roadmap items, stored in `reports`. User sees a basic results page when done.

### Acceptance criteria

- [ ] Each review classified into one of 18 categories with sentiment
- [ ] Classifications stored in `review_analyses`
- [ ] Report narrative generated and stored
- [ ] Chart data JSON generated (all 8 chart types)
- [ ] Roadmap items generated and stored
- [ ] Basic report page renders free-tier content (category breakdown, top 3 insights, 3 sample reviews per category)

---

## Phase 4: Gating & Payments

**User stories**: User pays to unlock full report

### What to build

Stripe one-time checkout sessions ($29 full, $49 full + competitors), Stripe webhook that sets `reports.unlocked = true` and `reports.tier`, gating logic in the report API and UI (blur/overlay for premium sections), competitor URL input on submission form for $49 tier.

### Acceptance criteria

- [ ] Free tier shows category breakdown + top 3 insights + 3 sample reviews per category
- [ ] Premium sections are visually gated (blurred/locked) for unpaid users
- [ ] Stripe checkout flow completes and unlocks report
- [ ] Webhook correctly updates `reports.unlocked` and `reports.tier`
- [ ] Competitor URLs accepted at submission for $49 tier
- [ ] Admin users bypass gating entirely

---

## Phase 5: Full Report UI & Charts

**User stories**: Paid user sees complete report with charts and competitor analysis

### What to build

Render all 8 chart types from stored chart data JSON, competitor radar + diff section, roadmap suggestions panel, full paginated review list with category filters. Polish the report page layout and design.

### Acceptance criteria

- [ ] Donut chart (category breakdown) renders
- [ ] Line chart (sentiment over time) renders
- [ ] Bar chart (rating distribution) renders
- [ ] Stacked area chart (category trends by month) renders
- [ ] Radar chart (competitor comparison) renders when competitors provided
- [ ] Heatmap (pain points) renders
- [ ] Ranked bar chart (feature requests) renders
- [ ] Review volume line chart renders
- [ ] Competitor diff section shows your app vs. competitors per category
- [ ] Roadmap suggestions panel renders with category tags
- [ ] Full review list with category filter and search

---

## Phase 6: Admin Dashboard

**User stories**: Admin monitors all platform activity

### What to build

Admin-only `/admin` route (role check middleware), dashboard showing all reports with user info and status, search by app name / user email / status, report detail view, basic usage stats (total reports, conversion rate free → paid, revenue).

### Acceptance criteria

- [ ] `/admin` returns 403 for non-admin users
- [ ] Admin sees all reports in a searchable table
- [ ] Search by app name, user email, report status
- [ ] Admin can view any report without payment
- [ ] Usage stats panel: total reports, paid conversions, total revenue

---

## Phase 7: Analytics & SEO

**User stories**: Platform is discoverable and user behaviour is tracked

### What to build

Google Analytics 4 and Posthog integration (page views, events, conversion funnel free → paid), SEO meta tags + Open Graph on landing and report pages, XML sitemap, structured data (JSON-LD) for report pages, core web vitals audit.

### Acceptance criteria

- [ ] GA4 tracking fires on page views and key events
- [ ] Posthog tracks: submit, processing_complete, upgrade_click, payment_complete
- [ ] Landing page has optimised title, description, OG tags
- [ ] Report pages have dynamic OG tags (app name, score)
- [ ] XML sitemap generated and linked in robots.txt
- [ ] Lighthouse SEO score ≥ 90
