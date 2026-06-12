# Web Component Patterns

Rules for writing maintainable React/Next.js components.

---

## Core Rules

### 1. Components stay small and focused
One component = one responsibility. If a component needs a long explanation of what it does, it should be split.

- **Target**: under 150 lines per component file
- **Signal to split**: the component renders meaningfully different sections that could stand alone

```tsx
// ❌ Doing too much
export function UserDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  useEffect(() => { /* fetch user */ }, []);
  useEffect(() => { /* fetch stats */ }, []);
  // ... 200 lines of render logic
}

// ✅ Composed from focused pieces
export function UserDashboard() {
  return (
    <DashboardLayout>
      <UserProfile />
      <StatsGrid />
      <RecentActivity />
    </DashboardLayout>
  );
}
```

### 2. Logic goes in hooks, not components

Anything more complex than a single `useState` should live in a custom hook. This keeps components readable and logic testable.

```tsx
// ❌ Logic in component
export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    if (!debouncedQuery) return;
    setLoading(true);
    fetch(`/api/search?q=${debouncedQuery}`)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false); });
  }, [debouncedQuery]);
  
  return <input onChange={e => setQuery(e.target.value)} />;
}

// ✅ Logic in hook
export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi(debouncedQuery),
    enabled: !!debouncedQuery,
  });
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(query);
  return <input onChange={e => setQuery(e.target.value)} />;
}
```

### 3. Constants in constants files

No magic strings or numbers inline in components.

```tsx
// ❌ Magic values
if (status === 'pending') { ... }
const MAX = 50;

// ✅ Named constants
import { ORDER_STATUS, PAGINATION } from '@/constants/orders.constants';
if (status === ORDER_STATUS.PENDING) { ... }
const MAX = PAGINATION.DEFAULT_PAGE_SIZE;
```

```typescript
// constants/orders.constants.ts
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
```

---

## File Naming

- Component: `UserCard.tsx` (PascalCase)
- Hook: `use-user-card.ts` (kebab-case with `use-` prefix) or `useUserCard.ts`
- Constants: `user.constants.ts` (kebab-case + `.constants.ts`)
- Types: `user.types.ts` (kebab-case + `.types.ts`)

---

## Props Pattern

Keep prop interfaces lean. If a component takes more than 6 props, consider if it's doing too much or if some props should be grouped.

```tsx
// Prefer explicit interfaces over inline types
interface UserCardProps {
  user: User;
  variant?: 'compact' | 'full';
  onAction?: (id: string) => void;
}

export function UserCard({ user, variant = 'full', onAction }: UserCardProps) {
  // ...
}
```

---

## When to Split a Component

Split when:
- The component exceeds ~150 lines
- A section of the render has its own distinct data needs
- The same pattern appears 3+ times
- A section is independently testable

Don't split when:
- It would create a one-use wrapper with no independent value
- The sub-component would have no meaningful name
