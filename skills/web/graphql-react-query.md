# GraphQL + React Query (Next.js)

Standard: `graphql-request` as the GraphQL client + TanStack Query v5 for server state.

---

## Setup

```typescript
// lib/api.ts — GraphQL client singleton
import { GraphQLClient, ClientError } from 'graphql-request';

export const apiClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/graphql',
  {
    credentials: 'include', // for cookie-based auth
  },
);
```

```typescript
// lib/query-client.tsx — React Query provider
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## GraphQL Organization

```
src/
├── graphql/
│   ├── queries/
│   │   ├── get-user.graphql
│   │   └── list-posts.graphql
│   ├── mutations/
│   │   ├── create-post.graphql
│   │   └── update-user.graphql
│   └── fragments/
│       └── user-fields.graphql
```

**Use GraphQL Code Generator** for typed operations — no manual typing:

```bash
npm run codegen   # regenerate after changing .graphql files
```

`codegen.ts`:
```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3001/graphql',
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    'src/graphql/__generated__/': {
      preset: 'client',
      plugins: [],
    },
  },
};
export default config;
```

---

## React Query Hooks

All data fetching wrapped in custom hooks. Hooks live in `src/hooks/`.

### Query hook pattern

```typescript
// hooks/use-user.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { GetUserDocument } from '@/graphql/__generated__/graphql';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => apiClient.request(GetUserDocument, { id: userId }),
    enabled: !!userId,
  });
}
```

### Mutation hook pattern

```typescript
// hooks/use-create-post.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { CreatePostDocument } from '@/graphql/__generated__/graphql';

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) =>
      apiClient.request(CreatePostDocument, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

---

## Error Handling

### Extracting GraphQL errors from ClientError

`graphql-request` throws a `ClientError` when the server returns `{ errors: [...] }`. Extract the message so your UI can display something useful:

```typescript
import { ClientError } from 'graphql-request';

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientError) {
    return error.response.errors?.[0]?.message ?? 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}
```

### Handling errors in hooks

```typescript
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) =>
      apiClient.request(CreatePostDocument, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      // Log or show a toast — don't swallow silently
      console.error('[useCreatePost]', getErrorMessage(error));
    },
  });
}
```

### Error boundaries for query failures

Wrap sections of the UI that might fail so one broken query doesn't crash the whole page:

```typescript
// app/[feature]/error.tsx — Next.js App Router error boundary
'use client';

export default function FeatureError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

For finer-grained boundaries inside a page, use React's `<ErrorBoundary>` with a library like `react-error-boundary`:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<p>Failed to load comments</p>}>
  <CommentList postId={postId} />
</ErrorBoundary>
```

---

## Query Key Convention

```typescript
['users']                    // all users
['users', userId]            // specific user
['users', userId, 'posts']  // user's posts
['posts', { status: 'published' }]  // filtered list
```

---

## Server-Side Prefetching (Next.js App Router)

Prefetch in Server Components to avoid client-side loading states. The data is serialized into the HTML and hydrated on the client — the hook call hits the cache immediately.

```typescript
// app/users/[id]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { GetUserDocument } from '@/graphql/__generated__/graphql';

export default async function UserPage({ params }: { params: { id: string } }) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['users', params.id],
    queryFn: () => apiClient.request(GetUserDocument, { id: params.id }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile userId={params.id} />
    </HydrationBoundary>
  );
}

// components/features/user/UserProfile.tsx (Client Component)
'use client';
export function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useUser(userId);
  // data is already available from SSR — no loading flash on first render
}
```

---

## Optimistic Updates

For instant UI feedback on mutations:

```typescript
export function useToggleLike(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (liked: boolean) =>
      apiClient.request(ToggleLikeDocument, { postId, liked }),

    onMutate: async (liked) => {
      // Cancel in-flight queries so they don't overwrite the optimistic state
      await queryClient.cancelQueries({ queryKey: ['posts', postId] });

      // Snapshot current value for rollback
      const previous = queryClient.getQueryData(['posts', postId]);

      // Apply the optimistic update immediately
      queryClient.setQueryData(['posts', postId], (old: Post) => ({
        ...old,
        liked,
        likeCount: liked ? old.likeCount + 1 : old.likeCount - 1,
      }));

      return { previous };
    },

    onError: (_err, _liked, context) => {
      // Roll back to the snapshot on failure
      queryClient.setQueryData(['posts', postId], context?.previous);
    },

    onSettled: () => {
      // Sync with server state regardless of outcome
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
    },
  });
}
```

---

## Rules

- **All GQL operations in `.graphql` files** — never inline query strings in hooks
- **Run codegen after schema changes** — always use generated types, never manual
- **Hooks for all data fetching** — components stay presentational
- **Query keys follow the `[scope, ...params]` convention** — enables precise invalidation
- **`staleTime` on every query** — never leave it at 0 for production list queries
- **Server prefetch for above-the-fold data** — avoids loading state on first render
- **Always handle errors explicitly** — log them or surface them to the user; never swallow silently
