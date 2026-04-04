# Performance & Feature Development

## React Native Performance

Performance optimization guide covering JavaScript/React, Native (iOS/Android), and bundling optimizations.

### When to Apply

- Debugging slow/janky UI or animations
- Investigating memory leaks (JS or native)
- Optimizing app startup time (TTI)
- Reducing bundle or app size
- Writing native modules (Turbo Modules)
- Profiling React Native performance

### Priority Order

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | FPS & Re-renders | CRITICAL |
| 2 | Bundle Size | CRITICAL |
| 3 | TTI Optimization | HIGH |
| 4 | Native Performance | HIGH |
| 5 | Memory Management | MEDIUM-HIGH |
| 6 | Animations | MEDIUM |

### Critical: FPS & Re-renders

- Replace ScrollView with FlatList/FlashList for lists
- Use React Compiler for automatic memoization
- Use atomic state (Jotai/Zustand) to reduce re-renders
- Use `useDeferredValue` for expensive computations

### Critical: Bundle Size

- Avoid barrel imports (import directly from source)
- Remove unnecessary Intl polyfills (Hermes has native support)
- Enable tree shaking (Expo SDK 52+ or Re.Pack)
- Enable R8 for Android native code shrinking

### High: TTI Optimization

- Disable JS bundle compression on Android (enables Hermes mmap)
- Use native navigation (react-native-screens)
- Defer non-critical work with `InteractionManager`

### High: Native Performance

- Use background threads for heavy native work
- Prefer async over sync Turbo Module methods
- Use C++ for cross-platform performance-critical code

### Problem to Solution Mapping

| Problem | Solution |
|---------|----------|
| App feels slow/janky | Profile FPS, then profile React renders |
| Too many re-renders | React profiler, then React Compiler |
| Slow startup (TTI) | Measure TTI, then analyze JS bundle |
| Large app size | Analyze app size, then R8 for Android |
| Memory growing | JS memory leak tools or native leak tools |
| Animation drops frames | Use Reanimated worklets |
| List scroll jank | Use FlashList/LegendList with proper config |
| TextInput lag | Use uncontrolled components |

## Feature Development Guidelines

Performance-first guidelines for building new features, especially lists and scrollable content.

### Rule 1: Keep `renderItem` Components Flat and Simple

Components rendered via `renderItem` must be lightweight shells -- no heavy hooks, no complex logic. They receive data and callbacks as props.

**Bad -- hook initialized per item:**

```tsx
export const MusicFeedItemAvatar = ({ item }: Props) => {
  const { addFriend } = useAddFriend(); // duplicated N times
  // ...
};
```

**Good -- callback passed as prop, hook initialized once in parent:**

```tsx
// Parent (list-level or screen-level)
const { addFriend } = useAddFriend();

const handleAddFriend = useCallback(
  (author: MusicFeedPostAuthor) => {
    addFriend({
      friend: transformFeedPostAuthorToDetailedFriend(author),
      source: "music_feed",
    });
  },
  [addFriend],
);

// Inside renderItem
<MusicFeedItemAvatar item={item} onAddFriend={handleAddFriend} />;
```

**Checklist for `renderItem` components:**

- No heavy hooks (mutations, queries, navigation, toasts, etc.)
- All actions come in as callback props
- Minimal state -- prefer deriving values from props
- No `useEffect` with side effects

### Rule 2: No Inline Object or Array Styles High in the JSX Tree

Inline objects/arrays create new references on every render, breaking `React.memo`.

**Good -- use StyleSheet or memoized styles:**

```tsx
const styles = StyleSheet.create({
  container: { flexDirection: "row", padding: 12 },
  avatar: { backgroundColor: Color.GREY },
  content: { marginTop: 8 },
});
```

If dynamic styles are needed, memoize them:

```tsx
const dynamicStyle = useMemo(
  () => [styles.content, { marginTop: spacing }],
  [spacing],
);
```

### Rule 3: Use `EQFastText` and `EQFastView` Inside List Items

Inside list items, prefer `EQFastText` and `EQFastView` over standard `Text`/`View`. These bypass the JS-side wrapper and render directly to native.

```tsx
import { EQFastView } from "@components/eq-view/EQView";
import { EQFastText } from "@components/foundations/eq-text/EQText.component";

const MusicFeedItemContent = ({ title, subtitle }: Props) => (
  <EQFastView style={styles.container}>
    <EQFastText variant="16BoldParagraph">{title}</EQFastText>
    <EQFastText variant="14RegularParagraph">{subtitle}</EQFastText>
  </EQFastView>
);
```

**Caveats:**

- Do NOT use `EQFastView` when accessibility matters (screen readers)
- Do NOT use `EQFastView` as an ancestor of a `Text` element
- Use standard components for interactive/accessible areas, fast components for decorative/layout wrappers

### Rule 4: Add `backgroundColor` to Images

Images should always have a solid `backgroundColor` (typically `Color.GREY` or `Color.BLACK_05`) so loading shows a placeholder color instead of a blank gap.

```tsx
const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Color.GREY,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
```

## Implementation Details

### Image Handling

- Use expo-image for all image components
- Use `EqualsImage` for all images from our server
- When using `EqualsImage`, you must provide either a `width` prop or an `optimizedSize` prop
- Implement proper image loading and error states
- Use appropriate image formats (WebP where supported)
- Use proper image caching strategies (memory-disk for expo-image based components)

### Animations

- Use react-native-reanimated for all animations
- Implement proper gesture handling with react-native-gesture-handler

### Navigation

- Use react-navigation library for navigation
- Implement deep linking support
- Handle navigation state properly

### Lists

- Use LegendList for virtualized lists and leverage its performance boosting configurations
- Use FlashList as an alternative for high-performance lists

### Messaging / Chat

- Use `stream-chat-expo` (`ChannelList`, `Channel`, `MessageList`) for all chat UI
- Three separate `ChannelList` instances exist: DirectMessages, Chatrooms, MessageRequests
- Event handler changes must be applied consistently across all three screens
- Type aliases for handler params live in `Chat.types.ts`
- Channel type guards (`isDirectMessageChannel`, `isArtistChannel`) live in `Chat.constants.ts`

### Form Building

- Use formik for form state management
- Use Zod for form validation schemas

## Feature Development Checklist

When building or reviewing a feature with lists:

- `renderItem` components are flat -- no heavy hooks, callbacks come as props
- Heavy hooks are initialized once at the list/screen level
- No inline object/array styles high in the JSX tree
- `EQFastText` and `EQFastView` used inside list items where appropriate
- All images have a `backgroundColor` for smooth loading transitions
- `StyleSheet.create` used for all static styles
