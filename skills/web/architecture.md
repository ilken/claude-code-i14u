# Next.js 15 Web Architecture

Generic Next.js 15 architecture following App Router best practices. Project-specific knowledge belongs in the project's own `.claude/CLAUDE.md`.

---

## Folder Structure

```
src/
├── app/                    # App Router — routes, layouts, API routes
│   ├── layout.tsx          # Root layout (fonts, providers, dark mode)
│   ├── page.tsx            # Root page
│   ├── globals.css         # Tailwind base + CSS custom properties
│   ├── (marketing)/        # Route group — no URL segment
│   │   ├── about/
│   │   └── pricing/
│   ├── [feature]/          # Feature route
│   │   ├── page.tsx
│   │   ├── loading.tsx     # Suspense fallback
│   │   ├── error.tsx       # Error boundary
│   │   └── layout.tsx      # Scoped layout (optional)
│   └── api/
│       └── [endpoint]/
│           └── route.ts
├── components/
│   ├── ui/                 # shadcn/ui primitives + custom base components
│   ├── layout/             # App-level layout components (Header, Footer, Sidebar)
│   └── features/           # Feature-specific composite components
│       └── [feature]/
│           ├── [FeatureName].tsx
│           └── [FeatureName].test.tsx
├── hooks/                  # Custom React hooks (data fetching, state, utils)
│   └── use-[resource].ts
├── lib/                    # Non-React utilities, clients, config
│   ├── api.ts              # API client (fetch wrapper / graphql-request)
│   ├── query-client.tsx    # React Query provider
│   └── utils.ts            # cn() helper and misc utilities
├── actions/                # Server Actions
│   └── [domain].actions.ts
├── constants/              # App-wide constants
│   └── [domain].constants.ts
├── types/                  # Global TypeScript type definitions
│   ├── api.types.ts
│   └── common.types.ts
└── context/                # React Context providers (use sparingly — prefer Jotai/Zustand)
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React component file | PascalCase | `UserCard.tsx`, `AuthForm.tsx` |
| Hook file | `use-` prefix + kebab-case | `use-user.ts`, `use-local-storage.ts` |
| Utility/lib file | camelCase | `formatDate.ts`, `api.ts` |
| Constants file | `[domain].constants.ts` | `auth.constants.ts`, `routes.constants.ts` |
| Type file | `[domain].types.ts` | `api.types.ts` |
| Test file | Same name + `.test.tsx` | `UserCard.test.tsx` |
| Page/layout/route | lowercase (Next.js convention) | `page.tsx`, `layout.tsx`, `route.ts` |
| Server Action file | `[domain].actions.ts` | `user.actions.ts` |

---

## Component Tiers

### `components/ui/` — Primitives
shadcn/ui components + custom base components. Stateless, no business logic.

### `components/layout/` — App structure
Header, Footer, Sidebar, Nav. May accept data props but no API calls.

### `components/features/` — Business UI
Composite components for a specific feature. Use hooks for data. Keep presentational.

---

## Server vs Client Components

Default to **Server Components** — they run on the server, have zero JS bundle cost, and can fetch data directly. Add `'use client'` only when the component needs interactivity.

```typescript
// Server Component — no directive needed
export default async function Page() {
  const data = await fetchData(); // Direct server fetch — no loading state
  return <Component data={data} />;
}

// Client Component
'use client';
export function InteractiveWidget() {
  const [open, setOpen] = useState(false);
  return ...;
}
```

Use `'use client'` when you need: `useState`/`useEffect`, event handlers, browser APIs, React Query, or context.

Push `'use client'` as far down the tree as possible — the boundary doesn't need to be at the page level. A page can be a Server Component that renders one small interactive `<LikeButton />` as a Client Component.

---

## Server Actions

Server Actions are async functions that run on the server, called directly from Client Components. They're the right tool for form submissions, mutations, and anything that needs server-side validation without a dedicated API route.

```typescript
// actions/user.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  name: z.string().min(1),
  bio: z.string().max(500).optional(),
});

export async function updateProfile(formData: FormData) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await userService.update(session.user.id, parsed.data);
  revalidatePath('/profile');
}
```

```typescript
// Client Component calling the action
'use client';
import { updateProfile } from '@/actions/user.actions';

export function ProfileForm() {
  return (
    <form action={updateProfile}>
      <input name="name" />
      <button type="submit">Save</button>
    </form>
  );
}
```

Server Actions always validate input on the server — never trust form data without parsing. `revalidatePath` invalidates the Next.js cache for the affected route.

---

## Middleware — Auth Guards

Middleware runs before every request and is the right place to protect routes globally. This keeps auth logic out of individual pages.

```typescript
// middleware.ts (root of project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isPublic = PUBLIC_ROUTES.includes(request.nextUrl.pathname);

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

The `matcher` excludes Next.js internals and static files — without this, middleware runs on every asset request.

---

## Hooks Pattern

All data-fetching and complex state in custom hooks. Components stay presentational.

```typescript
// hooks/use-user.ts
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.getUser(id),
  });
}
```

---

## Constants Pattern

No magic strings or numbers inline. All constants in dedicated files.

```typescript
// constants/routes.constants.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const;
```

---

## Critical Anti-Patterns

1. **Everything in `app/`** — route files should only compose, not contain logic
2. **Inline constants** — never `if (role === 'admin')`, use `ROLES.ADMIN`
3. **Logic in components** — extract to hooks
4. **`utils/` black hole** — split into `lib/[domain].ts` files
5. **Over-nesting** — max 4 directory levels; flatten when routes go deep
6. **Mixing server/client** — keep fetching in server components or React Query hooks
7. **Auth only in middleware** — also verify session in API routes and Server Actions; middleware can be bypassed
