# TypeScript & React Patterns (React Native)

---

## TypeScript Guidelines

- Use `type` over `interface`
- Avoid enums — use `as const` maps instead
- Use strict mode
- Use functional components only

```typescript
// ✅ const map over enum
export const OrderStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DONE: 'done',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// ❌ enum
enum OrderStatus { PENDING, ACTIVE, DONE }
```

---

## Hook Patterns

### Mutation with Optimistic Updates

```typescript
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.followUser(userId),

    async onMutate(userId) {
      await queryClient.cancelQueries({ queryKey: ['following', userId] });
      const previous = queryClient.getQueryData(['following', userId]);
      queryClient.setQueryData(['following', userId], true);
      return { previous };
    },

    onError(_err, userId, context) {
      queryClient.setQueryData(['following', userId], context?.previous);
    },

    onSettled(_data, _err, userId) {
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
    },
  });
}
```

### Safe Operation Hooks (try/catch, return boolean)

Wrap async operations that can fail silently:

```typescript
export function useSendMessageSafe() {
  return useCallback(async (channelId: string, text: string): Promise<boolean> => {
    try {
      await chatClient.sendMessage(channelId, { text });
      return true;
    } catch (error) {
      console.error('Failed to send message', error);
      return false;
    }
  }, []);
}
```

### Infinite / Paginated Queries

```typescript
export const usePaginatedPosts = (take = 20) => {
  const query = useInfiniteQuery({
    queryKey: ['posts', { take }],
    queryFn: ({ pageParam = 0 }) => api.getPosts({ skip: pageParam, take }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < take) return undefined;
      return allPages.length * take;
    },
  });

  return useMemo(() => ({
    ...query,
    data: query.data?.pages.flatMap(page => page.data),
    total: query.data?.pages[0]?.total ?? 0,
  }), [query]);
};
```

### Typed Error Handling in Hooks

```typescript
export const useHandleApiError = () => {
  const showToast = useToast();

  return useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'NOT_FOUND':
          showToast({ title: 'Item not found' });
          return;
        case 'UNAUTHORIZED':
          showToast({ title: 'Please log in again' });
          return;
      }
    }
    // Re-throw unknown errors
    throw error;
  }, [showToast]);
};
```

---

## React Query Rules

### Query key factory (prevents duplication)

```typescript
// lib/query-keys.ts
export const queryKeys = {
  users: {
    all: () => ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    posts: (id: string) => ['users', id, 'posts'] as const,
  },
  posts: {
    all: () => ['posts'] as const,
    detail: (id: string) => ['posts', id] as const,
  },
} as const;
```

### Stable queryFn — declare outside component/hook scope

```typescript
// ❌ inline — new function reference on every render
useQuery({
  queryKey: queryKeys.users.detail(id),
  queryFn: () => api.getUser(id),
});

// ✅ stable reference
const fetchUser = (id: string) => api.getUser(id);

useQuery({
  queryKey: queryKeys.users.detail(id),
  queryFn: () => fetchUser(id),
});
```

### Hook return rules

- **Always** wrap returned callbacks in `useCallback`
- **Always** memoize returned objects/arrays with `useMemo`
- **Always** include all dependencies (ESLint `exhaustive-deps` rule)

```typescript
export function useUserActions(userId: string) {
  const mutation = useFollowUser();

  const follow = useCallback(() => {
    mutation.mutate(userId);
  }, [mutation, userId]);

  return useMemo(() => ({
    follow,
    isLoading: mutation.isPending,
  }), [follow, mutation.isPending]);
}
```

---

## State Management

- **React Query** — all server/async state
- **Jotai or Zustand** — cross-screen UI state (modals, selected items, app-level flags)
- **`useState`** — local UI state only (input value, accordion open/closed)
- **Context** — stable shared values (theme, auth, locale) — not for frequently-updating state
- Minimize `useState` + `useEffect` combinations — prefer derived state or React Query

---

## Error Handling

- Validate external data with Zod at the API boundary
- Handle errors at the top of functions with early returns
- Use global error boundaries for unrecoverable errors
- Never swallow errors silently — at minimum log them

```typescript
// Zod at API boundary
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const fetchUser = async (id: string): Promise<User> => {
  const raw = await api.get(`/users/${id}`);
  return UserSchema.parse(raw); // throws if shape is wrong
};
```
