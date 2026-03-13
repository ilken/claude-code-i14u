---
name: Always run full lint
description: Run yarn code:full-lint (not just yarn code:tsc) before committing backend changes
type: feedback
---

Always run `yarn code:full-lint` as the final validation step, not just `yarn code:tsc`.

**Why:** User asked "have you run full lint and prettier?" after I only ran `yarn code:tsc`. TypeScript typechecking alone misses import ordering (ESLint) and formatting (Prettier) issues that fail CI.

**How to apply:** After any backend code change, run `yarn code:full-lint` before committing. This runs prettier + eslint + tsc together. Fix any issues in a loop until clean.
