# React Native / Expo Architecture & Conventions

---

## Directory Structure

```
src/
├── screens/
│   └── {feature}/
│       ├── {Feature}.screen.tsx          # rendering only (MVVM)
│       ├── hooks/
│       │   └── use{Feature}.hook.ts      # all logic lives here
│       └── components/
│           └── {Component}.component.tsx
├── components/
│   └── {component-name}/
│       ├── {ComponentName}.component.tsx
│       ├── {ComponentName}.types.ts
│       └── {ComponentName}.constants.ts
├── hooks/
│   └── {domain}/
│       └── use{HookName}.hook.ts
├── providers/
│   └── {name}/
│       ├── {Name}.context.tsx
│       ├── {Name}.provider.tsx
│       └── use{Name}.hook.ts
├── navigation/
│   ├── RootNavigator.tsx
│   └── stacks/
│       └── {FeatureStack}.navigator.tsx
├── lib/
│   ├── api.ts                            # GraphQL/REST client
│   └── query-client.ts                  # React Query setup
├── constants/
│   ├── colors.constants.ts
│   ├── spacing.constants.ts
│   └── typography.constants.ts
├── utils/
│   └── {name}.utils.ts
├── types/
│   └── {domain}.types.ts
└── assets/
    ├── images/
    └── fonts/
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Directories | kebab-case | `user-profile/`, `auth-flow/` |
| Component file | PascalCase + `.component.tsx` | `UserCard.component.tsx` |
| Screen file | PascalCase + `.screen.tsx` | `ProfileScreen.screen.tsx` |
| Hook file | camelCase + `.hook.ts` | `useUserProfile.hook.ts` |
| Utilities | camelCase + `.utils.ts` | `formatDate.utils.ts` |
| Constants | camelCase + `.constants.ts` | `colors.constants.ts` |
| Types | camelCase + `.types.ts` | `user.types.ts` |
| Context | PascalCase + `.context.tsx` | `Auth.context.tsx` |
| Provider | PascalCase + `.provider.tsx` | `Auth.provider.tsx` |

---

## MVVM Pattern (Required for Non-Trivial Screens)

Screens render only. All query/mutation/state/callback logic lives in a `use{ScreenName}` hook.

```typescript
// screens/profile/ProfileScreen.screen.tsx — rendering only
export const ProfileScreen = ({ route }: ProfileScreenProps) => {
  const { userId } = route.params;
  const { profile, isLoading, onFollow } = useProfileScreen(userId);

  if (isLoading) return <ActivityIndicator />;
  if (!profile) return <EmptyState />;

  return (
    <ScrollView>
      <ProfileHeader profile={profile} onFollow={onFollow} />
    </ScrollView>
  );
};

// screens/profile/hooks/useProfileScreen.hook.ts — all logic
export const useProfileScreen = (userId: string) => {
  const { data: profile, isLoading } = useProfile(userId);
  const followMutation = useFollowUser();

  const onFollow = useCallback(() => {
    followMutation.mutate(userId);
  }, [followMutation, userId]);

  return { profile, isLoading, onFollow };
};
```

**Screen body structure:**
```typescript
export const MyScreen = ({ route, navigation }: MyScreenProps) => {
  /* Hooks */
  /* States */
  /* Callbacks */
  /* Effects */
  // Early returns (loading, error, not-found)
  return (...);
};
```

Use `useLayoutEffect` (not `useEffect`) to set navigation options:
```typescript
useLayoutEffect(() => {
  navigation.setOptions({ title: profile?.name });
}, [profile, navigation]);
```

---

## Component Patterns

### Props — use `type`, not `interface`
```typescript
type UserCardProps = {
  user: User;
  onPress?: (id: string) => void;
};
```

Use **discriminated unions** for conditional props:
```typescript
type WithAction =
  | { actionEnabled: true; onAction: () => void }
  | { actionEnabled: false; onAction?: never };

type ItemProps = BaseProps & WithAction;
```

### Exports — named only, never default
```typescript
export const UserCard = ({ user }: UserCardProps) => { ... };
```

### Skeleton co-location
```typescript
export const UserCard = ({ user }: UserCardProps) => { ... };

export const UserCardSkeleton = React.memo(() => (
  <View style={styles.container}>
    <Skeleton width={54} height={54} radius="round" />
  </View>
));
```

### Memoization
- Wrap list-rendered and pure leaf components in `React.memo`
- Do NOT wrap every component — only leaf/pure/list-rendered ones

### Conditional rendering — ternary with `null`, not `&&`
```typescript
// ✅
{isVisible ? <Options /> : null}

// ❌ can render "0" or "false"
{count && <Badge count={count} />}
```

### Component internal order
1. Derived variables
2. Hooks (`useCallback`, `useMemo`, data hooks)
3. Callbacks
4. JSX return

---

## Provider (Context) Pattern — Three-File Convention

```typescript
// 1. {Name}.context.tsx — creates context with typed default
export const ThemeContext = createContext<ThemeContextProps>({
  colors: defaultColors,
  isDark: false,
});

// 2. {Name}.provider.tsx — provider component, memoize value
export const ThemeProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const value = useMemo(() => ({
    colors: isDark ? darkColors : lightColors,
    isDark,
    toggle: () => setIsDark(d => !d),
  }), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
});

// 3. use{Name}.hook.ts — convenience hook, never useContext directly in components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Rules:**
- Never call `useContext(SomeContext)` directly in components — always via hook
- Always memoize context value with `useMemo`
- Always wrap provider in `React.memo`

---

## Import Organization

1. React and React Native
2. Expo packages
3. Third-party libraries (navigation, query, etc.)
4. Local components
5. Local hooks
6. Local utils / constants
7. Type imports

Use absolute imports with path aliases (configured in `babel.config.js`):
```
@/screens, @/components, @/hooks, @/providers, @/lib, @/constants, @/types, @/assets
```

---

## Navigation (React Navigation)

Type screen props using `NativeStackScreenProps`:
```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params;
};
```

Define `RootStackParamList` in `navigation/types.ts`:
```typescript
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};
```

---

## GraphQL Workflow

- Write operations in `.graphql` files under `src/lib/graphql/`
- Run `yarn codegen` after any `.graphql` file change
- Never hand-edit generated types in `__generated__/`
- All queries/mutations wrapped in custom hooks (never call API client directly in components)
