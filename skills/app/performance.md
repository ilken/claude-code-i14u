# React Native / Expo Performance

---

## Priority Order

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | FPS & Re-renders | CRITICAL |
| 2 | Bundle Size | CRITICAL |
| 3 | TTI (Time to Interactive) | HIGH |
| 4 | Native Performance | HIGH |
| 5 | Memory Management | MEDIUM-HIGH |
| 6 | Animations | MEDIUM |

---

## Problem → Solution Map

| Problem | Solution |
|---------|----------|
| App feels janky | Profile FPS → profile React renders |
| Too many re-renders | React Profiler → React Compiler / memo |
| Slow startup (TTI) | Measure TTI → analyze JS bundle |
| Large app size | R8 for Android, tree shaking |
| Memory growing | JS leak tools or native instruments |
| Animation drops frames | Reanimated worklets |
| List scroll jank | FlashList / LegendList with proper config |
| TextInput lag | Use uncontrolled components |

---

## Critical: FPS & Re-renders

- **Replace `ScrollView` with `FlashList` or `LegendList`** for any list > 10 items
- Use **React Compiler** (Expo SDK 52+) for automatic memoization
- Use atomic state (Jotai/Zustand) to reduce component re-render scope
- Use `useDeferredValue` for expensive derived computations
- Use `React.memo` on leaf components and list-rendered items

---

## Critical: Bundle Size

- **Avoid barrel imports** — import directly from source files
  ```typescript
  // ❌ imports entire library
  import { Button } from '@components';
  // ✅ direct import
  import { Button } from '@components/Button/Button.component';
  ```
- Remove unused Intl polyfills (Hermes has native support)
- Enable tree shaking (Expo SDK 52+ or Re.Pack)
- Enable **R8** for Android native code shrinking

---

## High: TTI Optimization

- Disable JS bundle compression on Android (enables Hermes mmap for faster startup)
- Use `react-native-screens` for native navigation (already included with Expo Router)
- Defer non-critical work with `InteractionManager`:
  ```typescript
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      // analytics, prefetch, non-critical setup
    });
  }, []);
  ```

---

## List Performance Rules

### Rule 1: Keep `renderItem` components flat and prop-driven

Components inside `renderItem` must be lightweight shells. No heavy hooks, no API calls. Callbacks come as props from the parent.

```tsx
// ❌ hook initialized N times (once per item)
const FeedItem = ({ item }: Props) => {
  const { follow } = useFollowUser(); // duplicated per item
  return <Text onPress={() => follow(item.userId)}>{item.title}</Text>;
};

// ✅ hook initialized once at list level, passed as prop
const { follow } = useFollowUser();
const handleFollow = useCallback((userId: string) => follow(userId), [follow]);

// renderItem
<FeedItem item={item} onFollow={handleFollow} />
```

**`renderItem` checklist:**
- No heavy hooks (mutations, queries, navigation, toasts)
- All callbacks passed as props
- Minimal local state — derive from props
- No `useEffect` with side effects

### Rule 2: No inline styles high in the JSX tree

Inline objects create new references on every render, breaking `React.memo`.

```tsx
// ❌ new object reference every render
<View style={{ flexDirection: 'row', padding: 12 }} />

// ✅ StyleSheet (stable reference)
const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 12 },
});

// ✅ dynamic but memoized
const dynamicStyle = useMemo(
  () => [styles.row, { marginTop: spacing }],
  [spacing],
);
```

### Rule 3: Add `backgroundColor` to images

Prevents layout shift while images load:

```tsx
const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.backgroundElevated,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
```

### Rule 4: Use `FlashList` (or `LegendList`) for large lists

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <FeedItem item={item} onAction={handleAction} />}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

---

## Animations

- Use **react-native-reanimated** for all animations — runs on the UI thread
- Use **react-native-gesture-handler** for touch gestures
- Never animate layout properties (`width`, `height`, `top`, `left`) — animate `transform` instead
- Use `withTiming` / `withSpring` from Reanimated — avoid JS-side animation loops

```typescript
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const onPress = () => {
  scale.value = withSpring(0.95, { damping: 15 });
};
```

---

## Image Handling

- Use **expo-image** for all image components (caching, progressive loading, WebP support)
- Always provide explicit `width` and `height` — never let images size themselves
- Set `contentFit` explicitly: `'cover'` | `'contain'` | `'fill'`

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: avatarUrl }}
  style={styles.avatar}
  contentFit="cover"
  transition={200}
/>
```

---

## Forms

- Use **react-hook-form** for form state (lighter than Formik)
- Use **Zod** for validation schemas

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```
