# Clip Factory — Business Plan & Scaffold

Project: `~/Developer/clip-factory/` — automated Shorts/TikTok/Reels clipping business (Business/AI/Finance/CEO niche). Goal $10 → $100 → $1,000 → $10,000/mo via hybrid strategy: paid clipping campaigns (Whop/Vyro/Clipster) first, owned niche channel in parallel. Decisions locked: authorized-first copyright · Next.js local dashboard · manual review gate.

Full strategy docs: `~/Developer/clip-factory/business-plan/` (start at `00-overview.md`). Execution roadmap with milestone checkboxes: `business-plan/06-milestones-and-metrics.md`.

## This session (scaffold + business plan)

- [x] Create folder tree (`business-plan/`, `pipeline/`, `app/`, `content/01-inbox` → `06-published` + `archive`)
- [x] Write 8 business-plan docs (overview, market, revenue, platforms, content, tech, milestones, risks)
- [x] Write project `CLAUDE.md` (rules: authorized-first, review gate, no bots; filesystem-as-database)
- [x] `git init`, `.gitignore` (content media untracked), initial commits on `ilken/business-plan`
- [x] Tooling spec finalized in `05-tech-pipeline.md`: `clipctl` CLI surface (typer + uv), campaign registry (`campaigns/*.json`), income ledger (`finance/ledger.csv`), dashboard pages (Board / Post Kit / Campaigns / Income)
- [x] `GUIDE.md` operator handbook: step-by-step track campaigns → clip → review → post → track income, with manual fallbacks until each phase ships
- [x] Brand identity: **The Boardroom Brief** (@boardroombrief) + account warm-up ramp (`business-plan/08-brand-and-accounts.md`)
- [x] Clip visual spec: midnight/pistachio/Montserrat tokens, safe zones, karaoke captions, hook banner (`specs/clip-visual-spec.md`)
- [x] Selection rubric + system prompt v1 for `select.py` (`specs/selection-rubric.md`)

## Backlog (identified gaps — revisit at their milestone)

- [ ] Experimentation loop: hook-style tagging in sidecars → Friday review learns which hook types win (fold into Phase A/B build)
- [ ] Affiliate shortlist: 3–5 named programs with rates for the Linktree (before $100 milestone)
- [ ] Retainer service package: tiers, deliverables, lightweight agreement (month 3+, when outreach converts)
- [ ] Owned-channel editorial identity: recurring formats/series beyond a clip feed (before pushing Engine 2 hard)
- [ ] Ops details: content/ disk-pruning policy, copyright-claim dispute playbook, payout/tax admin specifics

## Next sessions (each gets its own RALF plan)

- [ ] **Manual milestone — first $10:** Ilken signs up Whop/Vyro/Clipster + posting accounts; 3 manual clips on one Whop campaign (Whop pays first 3 regardless of views)
- [ ] **Pipeline Phase A (→ $100):** `ingest.py` (yt-dlp) → `transcribe.py` (faster-whisper) → `select.py` (Claude API) → basic `render.py` (ffmpeg, static crop + captions)
- [ ] **Pipeline Phase B + Dashboard (→ $1,000):** face-tracked crop, hook banner, Next.js kanban dashboard with review gate, scheduler-assisted posting
- [ ] **Phase C (→ $10,000):** YouTube API auto-publish, analytics ingestion, retainer multi-client support
