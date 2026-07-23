# Plan: Affiliate Link Sniper

> Source: ilken/affiliate-link-sniper#1 (PRD)

## Architectural decisions

- **Monorepo**: `apps/backend` (NestJS) + `apps/web` (Next.js 15) under one repo
- **Infra**: Docker Compose — services: `postgres` (5432), `redis` (6379), `backend` (3001), `web` (3000)
- **API**: GraphQL — `@nestjs/graphql` on backend, `graphql-request` + TanStack Query v5 on web
- **Queue**: BullMQ + Redis — two queues: `youtube-scrape`, `domain-check`
- **Schema**: Three models — `Video`, `Link`, `ScrapeJob` (see PRD for full Prisma schema)
- **Domain check**: HTTP GET (5s timeout) → `dns.promises.lookup` fallback; `ENOTFOUND`/`NXDOMAIN` = broken
- **Allowlist filter**: instagram, facebook, twitter, amazon, amzn.to, youtube, youtu.be, bit.ly, linktr.ee, t.co, linkin.bio
- **Auth**: None — local dashboard only
- **Namecheap URL pattern**: `https://www.namecheap.com/domains/registration/results/?domain={domain}`
- **Key env vars**: `DATABASE_URL`, `REDIS_URL`, `YOUTUBE_API_KEY`

---

## Phase 1: Monorepo scaffold + scraping pipeline

**User stories**: Enables all — this is the data foundation.

### What to build

Set up the monorepo with Docker Compose, initialise both app shells, define the Prisma schema, build the YouTube API client and domain checker service, wire up BullMQ with both processors, and expose a `triggerScrapeJob` GraphQL mutation. At the end of this phase, a developer can trigger a scrape via GraphQL playground and verify that Video + Link rows appear in the DB with `broken` status populated.

### Acceptance criteria

- [ ] `docker-compose up` starts all 4 services healthy (postgres, redis, backend, web)
- [ ] `apps/backend` boots without errors; GraphQL playground accessible at `localhost:3001/graphql`
- [ ] `apps/web` boots without errors at `localhost:3000`
- [ ] Prisma migrations run cleanly; all three tables exist with correct columns
- [ ] `triggerScrapeJob(niche: "tech review", region: US)` mutation creates a `ScrapeJob` record
- [ ] ScrapeJob transitions from PENDING → RUNNING → COMPLETED
- [ ] Videos from 2015–2018 with >500k views appear in the `Video` table
- [ ] Custom domain links extracted from descriptions; allowlisted domains absent from `Link` table
- [ ] `Link.broken` is populated (true/false) after domain-check processor runs
- [ ] `Link` table has no duplicate rows after two scrape runs on the same niche

---

## Phase 2: All-links dashboard (Tab 1)

**User stories**: #2 (see all links), #3 (flip broken toggle), #4 (filter by status/region)

### What to build

Add paginated `links` GraphQL query with `LinkFilterInput` (broken, region) and a `setBroken` mutation. Build the Next.js dashboard shell with tab navigation, then implement Tab 1: a paginated table showing video title (YouTube link), domain, view count, auto-check timestamp, and a broken toggle. Add filter controls for region and broken status.

### Acceptance criteria

- [ ] `links(page: 1, limit: 25)` query returns paginated results with correct total count
- [ ] Filter `broken: true` returns only broken links; `broken: false` returns only live
- [ ] Filter `region: GB` returns only GB-sourced links
- [ ] Dashboard opens at `localhost:3000` — two tabs visible (All Links, Broken Links)
- [ ] Tab 1 table renders: video title as clickable link (opens YouTube in new tab), domain, view count (formatted), broken status toggle, checked timestamp
- [ ] Flipping the broken toggle calls `setBroken` mutation and persists after page refresh
- [ ] Pagination controls work — next/prev page, shows current page and total
- [ ] Table is usable with 1000+ rows (no UI freeze)

---

## Phase 3: Broken-links processing (Tab 2)

**User stories**: #5 (broken-only tab), #6 (BUY/SKIP), #7 (copy domain), #8 (Namecheap link), #9 (notes)

### What to build

Add `setDecision` and `updateNotes` GraphQL mutations. Build Tab 2: filtered to `broken: true`, same table structure as Tab 1, with additional per-row action columns — BUY/SKIP toggle buttons, copy-domain button, open-Namecheap button, and an inline notes input that auto-saves on blur.

### Acceptance criteria

- [ ] `setDecision(linkId, decision: BUY)` persists; calling again with `SKIP` switches it; `null` clears it
- [ ] `updateNotes(linkId, notes: "...")` persists after page refresh
- [ ] Tab 2 shows only `broken: true` links, paginated identically to Tab 1
- [ ] BUY button highlights when selected; SKIP button highlights when selected; both clear when clicked again
- [ ] Copy domain button writes the bare domain to clipboard; visual feedback (brief label change)
- [ ] Namecheap button opens `https://www.namecheap.com/domains/registration/results/?domain={domain}` in new tab
- [ ] Notes field auto-saves on blur; no explicit save button needed; saves debounced within 500ms
- [ ] Decision and notes values survive tab switch and full page reload

---

## Phase 4: Scrape trigger UI

**User stories**: #1 (trigger from dashboard), #10 (live job status)

### What to build

Add a `scrapeJobs` GraphQL query. Add a "New Scrape" button to the dashboard header that opens a modal with a niche text input (default: "tech review") and a region selector (US / GB). On submit, call `triggerScrapeJob` mutation. Below the form, show a live-polling list of recent ScrapeJobs with status badges (PENDING → RUNNING → COMPLETED / FAILED), video count, and link count.

### Acceptance criteria

- [ ] "New Scrape" button visible in dashboard header at all times
- [ ] Modal opens with niche input pre-filled with "tech review" and region defaulting to US
- [ ] Submitting the form calls `triggerScrapeJob` and adds the new job to the status list immediately
- [ ] Job status list polls every 3 seconds while any job is PENDING or RUNNING; stops when all are terminal
- [ ] Status badges update without full page reload: PENDING (grey) → RUNNING (yellow) → COMPLETED (green) / FAILED (red)
- [ ] Completed jobs show videoCount and linkCount
- [ ] Failed jobs show errorMsg
- [ ] Modal can be closed and reopened without losing the job list
