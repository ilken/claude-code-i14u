# Agent Execution Guardrails

Rules to reduce avoidable iteration and keep implementations consistent.

## Screen Architecture

- MUST follow MVVM for non-trivial screens:
  - `Screen` file focuses on rendering/layout
  - `use{ScreenName}` hook owns query/mutation/state/callback logic
- MUST place reusable UI pieces in separate files (one component per file for extracted components)
- SHOULD colocate feature components/hooks under a feature folder when possible (e.g., `screens/{feature}/components`, `screens/{feature}/hooks`)

## React Query Patterns

- MUST keep `queryFn` stable by declaring it outside React components/hooks (no inline `queryFn` in `useQuery`/`useInfiniteQuery`)
- MUST keep `getNextPageParam` stable by declaring it outside component/hook scope (use the passed `queryKey` to extract dynamic variables)
- MUST build query keys from shared keys in `@src/hooks/invalidate-queries/useInvalidateQueries.ts` (`InvalidateQueryKeys`)
- MUST add a new enum key in `InvalidateQueryKeys` before introducing a new custom query key string
- SHOULD type query keys (`type QueryKey = [...]`) and use `QueryFunctionContext<QueryKey>`

## GraphQL Workflow

- MUST create or update GraphQL operation files in `src/api/graphql/**/*.graphql` (do not hand-edit generated operation types/hooks)
- MUST run `yarn codegen` after GraphQL operation changes
- MUST verify generated artifacts are updated (`src/api/graphql.ts`, `src/api/graphql-public.ts` when relevant)

## Validation

- MUST run lint checks on changed files before finishing
- MUST fix import ordering and hook dependency issues before handoff
