Scan changed files for performance anti-patterns and report findings.

Follow these steps:

1. **Get the diff**:
   - Run `git diff main...HEAD --name-only` to get all changed files on this branch
   - If no branch diff exists, fall back to `git diff --name-only` (unstaged changes)
   - Filter to source files only (`.ts`, `.tsx`, `.js`, `.jsx`) — skip tests, configs, and markdown

2. **Read changed files** and scan for these anti-patterns:

   ### Database & Queries
   - **N+1 queries**: `.map()` or `.forEach()` containing `await` with Prisma/DB calls inside. Should be a single batched query with `WHERE IN`.
   - **Missing `.select()` on Prisma queries**: `findMany`, `findFirst`, `findUnique` without `.select()` — fetches all columns unnecessarily.
   - **Unbounded queries**: `findMany()` without `take`/`limit` or pagination params. Risk of fetching entire tables.
   - **Missing indexes**: New `WHERE` clauses or `orderBy` on columns that may not be indexed (cross-reference with Prisma schema if available).
   - **Sequential independent queries**: Multiple `await` calls that don't depend on each other — should use `Promise.all()`.

   ### Imports & Bundle Size
   - **Full lodash imports**: `import _ from 'lodash'` or `import { x } from 'lodash'` instead of `import x from 'lodash/x'`.
   - **Heavy imports in hot paths**: Large libraries imported at the top level in frequently-called modules (e.g., `moment`, `dayjs` with all plugins, `xlsx`).

   ### I/O & Async
   - **Sync file operations**: `fs.readFileSync`, `fs.writeFileSync`, `fs.existsSync` in request handlers or hot paths.
   - **Missing `AbortController` / timeout on fetch**: External HTTP calls without timeout protection.
   - **Await in loops**: `for`/`while` loops with `await` inside — often better as `Promise.all()` with batching.

   ### Data Processing
   - **Missing pagination on list endpoints**: API endpoints returning arrays without limit/offset or cursor-based pagination.
   - **Large array operations without streaming**: Processing large datasets entirely in memory (e.g., reading all rows then filtering) instead of streaming or chunking.
   - **Repeated computation in loops**: Expensive operations (regex compilation, object creation) inside loops that could be hoisted.

3. **Report findings**:
   - Present as a table:
     ```
     | File | Line | Pattern | Severity | Suggestion |
     ```
   - Severity: **high** (will cause issues at scale), **medium** (inefficient but may be fine for now), **low** (minor optimization)
   - Only report findings in changed/new code — don't audit the entire codebase
   - If no findings, report a clean bill of health

4. **Offer fixes**:
   - For each high/medium finding, briefly describe the fix
   - Ask the user if they want you to apply any fixes
   - If yes, make the changes, validate, and commit
