---
name: debug-mode
description: Systematic debugging methodology — hypothesize causes, narrow down, add diagnostic logs, gather evidence, analyse, then fix. Use when facing a non-obvious bug, unexpected runtime behavior, failing tests with unclear cause, or when asked to enter debug mode.
---

# Debug Mode

A systematic debugging methodology. Use this when asked to enter debug mode or when facing a non-obvious bug.

---

## Step 1: Hypothesize

Reflect on 5-7 different possible sources of the problem. Consider:
- Recent changes that could have introduced the bug
- Data flow through the affected code path
- External dependencies (APIs, databases, caches)
- Environment differences (local vs staging vs production)
- Race conditions or timing issues
- Type mismatches or incorrect assumptions

## Step 2: Narrow Down

Distill the hypotheses to the 1-2 most likely sources based on:
- Error messages and stack traces
- Which code paths are actually exercised
- What changed recently

## Step 3: Add Diagnostic Logs

Before implementing a fix, add targeted logs to validate your assumptions:
- Track the transformation of data structures through the control flow
- Log inputs and outputs at key boundaries
- Use appropriate log levels (`console.log`, `console.warn`, `console.error`)

## Step 4: Gather Evidence

Collect logs from all relevant sources:
- Application logs (client and server)
- Build tool output (bundler, compiler)
- Network requests and responses
- If server logs are not accessible, ask the user to provide them

## Step 5: Analyse

With evidence in hand, produce a comprehensive analysis:
- What is actually happening vs what should happen
- Where in the flow does the data diverge from expectations
- Root cause identification

## Step 6: Iterate if Needed

If the root cause is still unclear:
- Suggest additional targeted logs
- Narrow the scope further
- Test individual assumptions in isolation

## Step 7: Fix and Clean Up

Once the fix is implemented:
- Verify the fix resolves the original issue
- Run validation commands to ensure no regressions
- Ask for approval to remove the diagnostic logs added in Step 3

---

## Project-Specific Tools

### Backend (NestJS)
- **BullMQ queue inspection** — check queue status, failed jobs, and retry counts via Bull Dashboard or CLI
- **Prisma query logging** — enable `log: ['query']` in PrismaClient to see generated SQL
- **Redis cache checks** — use `redis-cli` to inspect cached keys, TTLs, and stale data
- **NestJS debug logging** — use `Logger` with verbose mode to trace DI resolution and lifecycle hooks

### App (React Native / Expo)
- **React Native Debugger / Flipper** — inspect component tree, network requests, and async storage
- **React Query devtools** — check query cache state, stale queries, and refetch triggers
- **Performance profiling** — use React DevTools Profiler to identify unnecessary re-renders
- **Metro bundler logs** — check for module resolution errors and circular dependencies

### Web (Next.js)
- **Next.js debug mode** — set `DEBUG=*` or use `next dev --inspect` for server-side debugging
- **React Query devtools** — inspect query cache, background refetches, and error states
- **SSR vs CSR debugging** — check Network tab for hydration mismatches and double-fetch issues
- **Build analysis** — use `ANALYZE=true next build` to inspect bundle sizes and code splitting
