# GraphQL + React Query

Patterns for GraphQL operations and TanStack Query v5 data fetching.

---

## GraphQL Organization

| Type      | Location                                  |
| --------- | ----------------------------------------- |
| Queries   | `src/graphql/queries/{name}.graphql`      |
| Mutations | `src/graphql/mutations/{name}.graphql`    |
| Fragments | `src/graphql/fragments/{name}.graphql`    |
| Generated | `src/graphql/__generated__/`              |

### Key Patterns

- Use GraphQL Code Generator for typed operations -- no manual typing
- Fragment colocation: components define their own data requirements as fragments
- Run `npm run codegen` after changing `.graphql` files

---

## React Query (TanStack Query v5)

### Custom Hooks

All data fetching must be wrapped in custom hooks:

```typescript
// src/queries/users.ts
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUserProfile(userId),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users', data.id] });
    },
  });
}
```

### Query Keys

Follow the `[scope, ...params]` convention:

```typescript
['users']              // all users
['users', userId]      // specific user
['users', userId, 'posts']  // user's posts
```

### Cache Configuration

- Configure `staleTime` and `gcTime` appropriately
- No infinite caching by default
- Mutations use `onSuccess` for cache invalidation

### Server-Side Prefetching

Prefetch data in Server Components using `HydrationBoundary`:

```typescript
// app/users/[id]/page.tsx (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function UserPage({ params }: { params: { id: string } }) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['users', params.id],
    queryFn: () => fetchUserProfile(params.id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile userId={params.id} />
    </HydrationBoundary>
  );
}
```

### React Query Hooks Location

All query hooks live in `src/queries/{domain}.ts`.
