# Animations & Gestures (Reanimated v4 + Gesture Handler)

The app uses **`react-native-reanimated` v4** and **`react-native-gesture-handler` v2**. All animations run as worklets on the UI thread — keep them there. These rules prevent the most common source of animation jank: accidentally bouncing work back to the JS thread or triggering layout on every frame.

## Run / Never

- Never track scroll position in `useState`; use a shared value via `useAnimatedScrollHandler`. § Never Track Scroll Position in `useState`

## Checklist

- Only `transform` / `opacity` in `useAnimatedStyle` (layout → layout animations instead)
- `.get()` / `.set()` everywhere — no `.value`
- Shared value / state holds the **truth**; visuals derived via `interpolate`
- Animated press feedback uses `GestureDetector` + `runOnJS`, not `Pressable` callbacks
- Derivations use `useDerivedValue`; `useAnimatedReaction` only for side effects
- Scroll offset lives in a shared value or ref, never `useState`

## Animate `transform` and `opacity` Only

Only `transform` (`translate`, `scale`, `rotate`) and `opacity` are GPU-accelerated. Animating `width`, `height`, `top`, `left`, `margin`, or `padding` forces a layout recalculation **on every frame** and drops frames.

```tsx
// ❌ Animates height — layout recalculates every frame
const animatedStyle = useAnimatedStyle(() => ({
  height: withTiming(expanded ? 200 : 0),
}));

// ✅ Animate scaleY/translateY, give the view a fixed size
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scaleY: withTiming(expanded ? 1 : 0) }],
  opacity: withTiming(expanded ? 1 : 0),
}));
// <Animated.View style={[{ height: 200, transformOrigin: "top" }, animatedStyle]} />
```

If you genuinely need to animate layout (height/width settling), reach for `LayoutAnimation` / Reanimated layout transitions (`entering`/`exiting`/`layout`) rather than animating the property in `useAnimatedStyle`.

## Use `.get()` / `.set()`, Never `.value`

Reanimated v4 exposes shared values via `.get()` and `.set()`. Reading/writing `.value` directly works today but is the legacy API and **opts the component out of React Compiler** (which we are adopting — see [`react-compiler.md`](./react-compiler.md)). Always use the methods.

```tsx
const count = useSharedValue(0);

// ❌ count.value = count.value + 1;
// ✅
count.set(count.get() + 1);
```

## State Is Ground Truth — Derive the Visual

A shared value (or `useState`) must represent **what is true** (`pressed`, `progress`, `isOpen`), not the visual output (`scale`, `opacity`, `translateY`). Derive the visual with `interpolate`. This keeps one source of truth, makes adding a second visual effect trivial, and makes debugging (`pressed === 1`) far clearer than (`scale === 0.95`).

```tsx
const pressed = useSharedValue(0); // 0 = up, 1 = down — the truth

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, 0.95]) }],
  // adding opacity later is just one more interpolation off the same value
}));
```

The same principle applies to React state: store `isExpanded`, compute `const height = isExpanded ? 200 : 0` — never mirror derived values into a second `useState` + `useEffect`.

## Animated Press States: `GestureDetector`, Not `Pressable` Callbacks

For press feedback (scale/opacity on touch), drive a shared value from `Gesture.Tap()` inside a `GestureDetector`. Gesture callbacks are worklets running on the UI thread — no JS round-trip per touch. `Pressable`'s `onPressIn`/`onPressOut` hop to the JS thread and stutter under load. Use `runOnJS` to fire the actual JS handler.

```tsx
const pressed = useSharedValue(0);

const tap = Gesture.Tap()
  .onBegin(() => pressed.set(withTiming(1)))
  .onFinalize(() => pressed.set(withTiming(0)))
  .onEnd(() => runOnJS(onPress)());

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, 0.95]) }],
}));

return (
  <GestureDetector gesture={tap}>
    <Animated.View style={animatedStyle}>
      <EQText variant="16BoldButton">{label}</EQText>
    </Animated.View>
  </GestureDetector>
);
```

For a plain tap with **no** animated feedback, `Pressable` is still correct — see [`native-ui-patterns.md`](./native-ui-patterns.md).

## `useDerivedValue` for Derivations, `useAnimatedReaction` for Side Effects

When one shared value is computed from another, use `useDerivedValue` — it's declarative and tracks dependencies automatically and returns a value you use directly.

```tsx
const progress = useSharedValue(0);
const opacity = useDerivedValue(() => 1 - progress.get());
```

Reserve `useAnimatedReaction` for side effects that produce **no** value — triggering haptics, logging, or calling `runOnJS`.

## Never Track Scroll Position in `useState`

Scroll events fire every frame; `setState` per event causes render thrashing and dropped frames. Use a shared value via `useAnimatedScrollHandler` on an `Animated.ScrollView` for scroll-driven animation, or a `useRef` for non-reactive reads.

```tsx
const scrollY = useSharedValue(0);

const onScroll = useAnimatedScrollHandler({
  onScroll: e => {
    scrollY.set(e.contentOffset.y); // UI thread, no re-render
  },
});

return <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} />;
```

This applies equally to scroll-driven headers, parallax, and progress bars — the shared value feeds `useAnimatedStyle` directly.
