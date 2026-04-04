# Web Architecture

Next.js App Router conventions, file structure, and key patterns.

---

## App Router Conventions

- `page.tsx` -- route pages
- `layout.tsx` -- layouts (nested)
- `loading.tsx` -- suspense/loading states
- `error.tsx` -- error boundaries
- `not-found.tsx` -- 404 pages
- `middleware.ts` -- root middleware

## Server vs Client Components

- **Default to Server Components** -- no directive needed
- Add `"use client"` only when the component needs: hooks, event handlers, browser APIs, or state
- Data fetching happens in Server Components using `async` functions
- No `getServerSideProps` or `getStaticProps` -- use async Server Components instead
- Use `generateMetadata` for dynamic SEO; static `metadata` export for fixed pages

## File Structure

| What                    | Where                                          |
| ----------------------- | ---------------------------------------------- |
| Pages (routes)          | `app/{route}/page.tsx`                         |
| Layouts                 | `app/{route}/layout.tsx`                       |
| Loading states          | `app/{route}/loading.tsx`                      |
| Error boundaries        | `app/{route}/error.tsx`                        |
| API routes              | `app/api/{endpoint}/route.ts`                  |
| Root layout             | `app/layout.tsx`                               |
| Global styles           | `app/globals.css`                              |
| Reusable components     | `src/components/{component-name}.tsx`          |
| UI primitives           | `src/components/ui/`                           |
| Custom hooks            | `src/hooks/{hook-name}.ts`                     |
| GraphQL queries         | `src/graphql/queries/{name}.graphql`           |
| GraphQL mutations       | `src/graphql/mutations/{name}.graphql`         |
| GraphQL fragments       | `src/graphql/fragments/{name}.graphql`         |
| Generated GraphQL types | `src/graphql/__generated__/`                   |
| React Query hooks       | `src/queries/{domain}.ts`                      |
| Utility functions       | `src/lib/{name}.ts` or `src/utils/{name}.ts`   |
| Type definitions        | `src/types/{domain}.ts`                        |
| Validation schemas      | `src/schemas/{domain}.ts`                      |
| Constants               | `src/constants/{domain}.ts`                    |
| Middleware              | `middleware.ts` (root)                          |
| Tailwind config         | `tailwind.config.ts`                           |
| Next.js config          | `next.config.ts`                               |

## Path Aliases

| Alias | Maps to |
| ----- | ------- |
| `@/`  | `src/`  |

All imports from `src/` should use the `@/` prefix:
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/user';
```

## File Naming

- kebab-case for all files and directories: `user-profile.tsx`, `use-auth.ts`
- Typed extensions where useful: `.query.ts`, `.mutation.ts`, `.types.ts`, `.schema.ts`, `.utils.ts`

## Code Naming

- PascalCase for components and types
- camelCase for variables, functions, and hooks
- UPPER_SNAKE_CASE for constants

## Key Patterns

- Use `next/image` for all images (no raw `<img>`)
- Use `next/link` for navigation (no raw `<a>` for internal links)
- Use `next/font` for font loading
- Functional components only, named exports
- Props type defined at top of component file
- Single responsibility per component
- Import order: external -> internal -> parent -> sibling -> type
- Use `import type` for type-only imports
