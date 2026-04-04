# TypeScript & React Patterns

## TypeScript Guidelines

### Type System

- Use `type` over `interface`
- Avoid enums; use maps instead
- Use strict mode in TypeScript
- Use functional components with TypeScript types

### Error Handling

- Use Zod for runtime validation
- Handle errors at the beginning of functions
- Use early returns for error conditions
- Implement global error boundaries

## Hook Patterns

### Mutation Hooks (Optimistic Updates)

Use `onMutate` for optimistic cache updates, `onError` to rollback, and `onSettled` to invalidate:

```typescript
export function useFollow() {
  const queryClient = useAppQueryClient();

  const { mutateAsync, isLoading } = useFollowProfileMutation({
    async onMutate({ input: { followeeIds } }) {
      queryClient.setQueryData(isFollowingProfileQueryKey(followeeId), true);
    },
    onError(_, { input: { followeeIds } }) {
      queryClient.setQueryData(isFollowingProfileQueryKey(followeeId), false);
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: [...] });
    },
  });

  const follow = useCallback(async (followeeId: number) => {
    await mutateAsync({ ... });
  }, [mutateAsync]);

  return { follow, isLoading };
}
```

### Safe Operation Hooks

Wrap external/async calls in try/catch, return a boolean for success, log via `logger.error`:

```typescript
export function useSendMessageSafe() {
  return useCallback(async (args: SendMessageArgs): Promise<boolean> => {
    try {
      const channel = await getChannel(args.channelId);
      if (!channel) return false;

      await channel.sendMessage({ ... });
      return true;
    } catch (error) {
      logger.error("Failed to send message", { error });
      return false;
    }
  }, []);
}
```

### Infinite Query Hooks

Use `useInfiniteQuery` with `getNextPageParam`, flatten pages in returned `data`:

```typescript
export const usePaginatedItems = ({ take = 20 }) => {
  const query = useInfiniteQuery({
    queryKey: [InvalidateQueryKeys.Items, { take }],
    queryFn: fetchItems,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.data?.length < take) return undefined;
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

### Error Handling Hooks

Switch on `EqualsHttpError.type` for typed error handling, map to user-facing actions:

```typescript
export const useHandleChatError = () => {
  const { showAgeMismatchToast } = useAgeMismatchToast();

  return useCallback((error: unknown) => {
    if (error instanceof EqualsHttpError) {
      switch (error.type) {
        case EqualsClientErrorType.ChatChannel_AgeMismatch:
          showAgeMismatchToast();
          return;
      }
    }
    throw error;
  }, [showAgeMismatchToast]);
};
```

### React Query Stability Rules

- **MUST** keep `queryFn` stable by declaring it outside React components/hooks (no inline `queryFn` in `useQuery`/`useInfiniteQuery`)
- **MUST** keep `getNextPageParam` stable by declaring it outside component/hook scope (use the passed `queryKey` to extract dynamic variables)
- **MUST** build query keys from shared keys in `@src/hooks/invalidate-queries/useInvalidateQueries.ts` (`InvalidateQueryKeys`)
- **MUST** add a new enum key in `InvalidateQueryKeys` before introducing a new custom query key string

### General Hook Rules

- **MUST** wrap returned callbacks in `useCallback`
- **MUST** memoize returned objects/arrays with `useMemo`
- **MUST** include all dependencies in dependency arrays (`exhaustive-deps` is enforced)

## State Management

### Data Management

- Use Jotai for cross-screen state management
- Use react-query v4 for data fetching and caching
- Always access a context via a hook
- Declare a hook for each context

### Performance

- Minimize the use of `useState` and `useEffect`
- Prefer context and reducers for state management
- Use `useCallback` when defining callback functions
- Use `useMemo` for expensive operations and to memoize reference-type values
