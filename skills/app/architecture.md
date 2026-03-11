# Architecture & Naming Conventions

## Directory Structure

- Use kebab-case for directory names: `user-profile/`, `chat-screen/`, `auth-flow/`
- Group related components, hooks, and styles into feature-based directories

```
src/
├── screen/
│   ├── {screen}/
│   │   ├── {screen}.stack.ts
│   │   ├── {screen}.screen.ts
│   │   ├── {screen-additional}.screen.ts
│   │   ├── components/
│   │   │   └── {Component}.component.tsx
├── components/
│   ├── foundations/
│   │   ├── {component-name}/
│   │   │   ├── {ComponentName}.component.tsx
│   │   │   ├── {ComponentName}.types.ts
│   │   │   ├── {ComponentName}.constant.ts
├── hooks/
│   ├── {hook-context}/
│   │   └── use{HookName}.ts
├── providers/
│   ├── {provider}/
│   │   ├── use{Provider}.ts
│   │   ├── {Provider}.provider.tsx
│   │   ├── {Context}.provider.tsx
│   │   ├── {Context}.types.ts
├── utils/
│   └── {util-name}.utils.ts
├── transformers/
│   └── {transformer-name}.transformer.ts
└── typings/
    └── {typing-name}.types.ts
```

## File Naming

- **Components**: PascalCase -- `UserProfile.component.tsx`, `ChatMessage.component.tsx`
- **Hooks**: camelCase -- `useLocalization.hook.ts`, `useDevicePermissions.hook.ts`
- **Utilities**: camelCase -- `formatDate.utils.ts`, `validation.utils.ts`
- **Contexts/Providers**: PascalCase -- `Auth.context.ts`, `Auth.provider.tsx`
- **Types**: camelCase -- `user.types.ts`, `api.types.ts`
- **Constants**: camelCase -- `user.constants.ts`, `api.constants.ts`

## File Extensions

Use detailed extensions to indicate purpose:

- `.component.tsx` -- React components
- `.hook.ts` -- custom hooks
- `.utils.ts` -- utility functions
- `.types.ts` -- TypeScript types
- `.styles.ts` -- style definitions
- `.context.tsx` -- contexts
- `.test.tsx` / `.spec.tsx` -- test files
- `.constants.ts` -- constant definitions
- `.transformer.ts` -- data transformers

## Code Naming

- Descriptive variables with auxiliary verbs: `isLoading`, `hasError`, `shouldUpdate`
- PascalCase for components and types: `UserProfile`, `UserProfileProps`
- camelCase for variables, functions, hooks: `userData`, `handleSubmit`, `useLocalization`
- UPPER_SNAKE_CASE for constants: `API_ENDPOINT`, `MAX_RETRY_COUNT`

## File Structure Order

1. Types (especially component props)
2. Constants (if any)
3. Exported component/function
4. Subcomponents
5. Helper functions
6. Static content

## Import Organization

Group imports in this order:

1. React and React Native imports
2. Third-party library imports
3. Local component imports
4. Local hook imports
5. Local utility imports
6. Type imports

Use absolute imports with aliases from `babel.config.js`: `@assets`, `@providers`, `@hooks`, `@api`, `@styles`, `@constants`, `@components`, `@typings`

## Screen Patterns

### Props Typing

Type screen props using `NativeStackScreenProps` from react-navigation:

```typescript
type Props = NativeStackScreenProps<CommonTabScreens, "CollectableAlbum">;

export const CollectableAlbumScreen = ({ route, navigation }: Props) => {
  const { params: { collectableItemId } } = route;
};
```

### Section Comments

Organize screen body into logical sections with block comments:

```typescript
export const MyScreen = ({ route, navigation }: Props) => {
  /* Hooks */
  const { t } = useLocalization();
  const paddingBottom = useAdjustedBottomTabBarHeight();

  /* States */
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* Callbacks */
  const handleRefresh = useCallback(() => { ... }, []);

  /* Effects */
  useLayoutEffect(() => {
    navigation.setOptions({ title: data?.name });
  }, [data, navigation]);

  // Early returns
  if (isLoading) return <ActivityIndicator />;
  if (!data) return <NotFoundView />;

  return <ScrollView>...</ScrollView>;
};
```

### Screen Rules

- Use early returns for loading (`ActivityIndicator`) and error/not-found (`NotFoundView`) states
- Use `useLayoutEffect` (not `useEffect`) to set navigation options like title
- Extract complex screen logic into a dedicated hook: `use{ScreenName}`
- Define `StyleSheet.create` at the bottom of the screen file
- Use `useAdjustedBottomTabBarHeight()` for bottom padding on scrollable content

## Component Patterns

### Props Definition

Define props using `type` (not `interface`) at the top of the file. Use discriminated unions for conditional props:

```typescript
type RepostEnabled = {
  repostEnabled: true;
  onPressRepost: (post: MusicFeedPost) => void;
};
type RepostDisabled = {
  repostEnabled: false;
  onPressRepost?: undefined;
};
type Props = BaseProps & (RepostEnabled | RepostDisabled);
```

### Exports

- **MUST** use named exports -- never default exports
- Components in lists or with stable props **SHOULD** be wrapped in `React.memo`
- `React.memo` is not required on every component

### Skeleton Co-location

Export skeleton components from the same file, named `{ComponentName}Skeleton`:

```typescript
export const ProfileListTile: React.FC<Props> = ({ ... }) => { ... };

export const ProfileListTileSkeleton: React.FC = React.memo(() => {
  return (
    <View style={styles.container}>
      <Skeleton height={54} width={54} radius="round" />
    </View>
  );
});
```

### Component Internal Structure

1. Derived variables
2. Hooks (`useLocalization`, `useCallback`, `useMemo`, etc.)
3. Callbacks
4. JSX return

### Conditional Rendering

Use ternary with `null` instead of `&&` to avoid rendering `0` or `false`:

```typescript
{showOptions ? (
  <IconButton icon="threeDots" onPress={handlePress} />
) : null}
```

### Testing

Add `testID` prop on interactive and key visual elements.

### Anti-Patterns

- Don't use default exports
- Don't wrap every component in `React.memo` -- only leaf/pure/list-rendered components
- Don't use `&&` for conditional rendering
- Don't define props with `interface`

## Provider Patterns

### Triple-File Convention

Every context provider follows a three-file structure:

1. **`{Name}.context.tsx`** -- Creates the context with a typed default value
2. **`{Name}.provider.tsx`** -- The provider component (wrapped in `React.memo`)
3. **`use{Name}.tsx`** -- A convenience hook that consumes the context

### Context File

```typescript
import { createContext } from "react";
import type { MainPlayerContextProps } from "./MainPlayer.types";

export const MainPlayerContext = createContext<MainPlayerContextProps>({
  isLoading: false,
  collectableItemId: null,
  playableInformation: undefined,
});
```

### Provider File

- Wrap in `React.memo`
- **MUST** memoize the context value with `useMemo`

```typescript
export const MainPlayerProvider: React.FC<PropsWithChildren<Props>> =
  React.memo(({ children }) => {
    const { data, isLoading } = useQuery({ ... });

    const values = useMemo(() => ({
      playableInformation: data,
      isLoading,
    }), [data, isLoading]);

    return (
      <MainPlayerContext.Provider value={values}>
        {children}
      </MainPlayerContext.Provider>
    );
  });
```

### Hook File

- Never access a context directly with `useContext` outside its dedicated hook
- Derive additional computed properties in the hook

```typescript
export const useMainPlayer = () => {
  const { playableInformation, ...context } = useContext(MainPlayerContext);

  return useMemo(() => ({
    ...context,
    ...playableInformation,
    isCollaborator: playableInformation?.collaborators.some(...) ?? false,
  }), [context, playableInformation]);
};
```

### Anti-Patterns

- Don't use `useContext(SomeContext)` directly in components -- always use the dedicated hook
- Don't pass un-memoized objects as context values
- Don't skip `React.memo` on provider components

---

## GraphQL Workflow

- **MUST** create or update GraphQL operation files in `src/api/graphql/**/*.graphql` (do not hand-edit generated operation types/hooks)
- **MUST** run `yarn codegen` after GraphQL operation changes
- **MUST** verify generated artifacts are updated (`src/api/graphql.ts`, `src/api/graphql-public.ts` when relevant)
