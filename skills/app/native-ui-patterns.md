# Native UI Patterns

Prefer native platform primitives over JS reimplementations. Native components ship with built-in accessibility, platform-correct gestures, and better performance — and they're less code to maintain. These rules are stack-agnostic and apply across all screens.

## Checklist

- `Pressable` everywhere; no `Touchable*`
- Sheets/modals use `presentation: "formSheet"` (routed) or native `<Modal>` (local) before a JS sheet lib
- Root scroll view uses `contentInsetAdjustmentBehavior="automatic"`, not `SafeAreaView` wrapping
- Headers configured via native-stack `options`, not custom `header` components
- View measuring uses `onLayout` + functional `setState`, not `measure()`

## `Pressable`, Never `Touchable*`

Never use `TouchableOpacity` or `TouchableHighlight` — they're the legacy API. Use `Pressable`.

```tsx
// ❌ <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
// ✅
<Pressable onPress={onPress}>
  <EQText variant="16BoldButton">{label}</EQText>
</Pressable>
```

- Inside a scrollable list/`ScrollView`, import `Pressable` from `react-native-gesture-handler` (better gesture coordination) **only if** that scroll surface is also a Gesture Handler component; otherwise the RN core `Pressable` is fine.
- For **animated** press feedback (scale/opacity on touch), don't use `Pressable`'s style callback — use `GestureDetector` + a shared value. See [`animations.md`](./animations.md).

## Native Modals / Sheets Over JS Bottom-Sheet Libraries

For sheets and modals, prefer a native presentation. It gives swipe-to-dismiss, keyboard avoidance, and accessibility for free.

Via React Navigation (we use `@react-navigation/native-stack` v7) — the preferred route for routed sheets:

```tsx
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  options={{
    presentation: "formSheet",
    sheetAllowedDetents: "fitToContents", // or [0.5, 1.0]
  }}
/>
```

Or a standalone native `Modal` for local, non-routed UI:

```tsx
<Modal
  visible={visible}
  presentationStyle="formSheet"
  animationType="slide"
  onRequestClose={() => setVisible(false)}
>
  {/* content */}
</Modal>
```

Reach for a JS bottom-sheet library only when the design needs behaviour native sheets can't express (e.g. a backdrop-tracking sheet fused to gesture-driven content). When you do, follow the performance rules in [`performance-audit.md`](./performance-audit.md) (memoize the content subtree, avoid context-driven re-renders).

## Safe-Area Scrolling: `contentInsetAdjustmentBehavior`

For a screen whose root is a scroll view, let the OS handle safe-area insets with `contentInsetAdjustmentBehavior="automatic"` instead of wrapping in `SafeAreaView` or adding manual `paddingTop: insets.top`. The native approach handles dynamic insets (keyboard, toolbars) and lets content scroll naturally behind the status bar.

```tsx
// ❌ <SafeAreaView><ScrollView>…</ScrollView></SafeAreaView>
// ❌ contentContainerStyle={{ paddingTop: insets.top }}
// ✅
<ScrollView contentInsetAdjustmentBehavior="automatic">{/* … */}</ScrollView>
```

`useSafeAreaInsets()` is still correct for non-scroll layouts (a fixed footer button, an absolutely-positioned header). The rule is specifically about the root scroll view.

## Native Header Options Over Custom Header Components

With native-stack, configure the header through `options` rather than rendering a custom `header` component — you get iOS large titles, search bars, blur, and correct safe areas automatically. (Set dynamic values like `title` in `useLayoutEffect` per [`architecture.md`](./architecture.md).)

```tsx
<Stack.Screen
  name="Profile"
  component={ProfileScreen}
  options={{
    title: "Profile",
    headerLargeTitle: true,
    headerSearchBarOptions: { placeholder: "Search" },
  }}
/>
```

Use a custom `header` component only when the design can't be expressed through native options.

## Measuring Views: `onLayout` + Functional `setState`

To read a view's size, use `onLayout` and update state with a **functional** updater that bails out when the value is unchanged — reading state directly in the callback risks a stale closure and an unnecessary re-render. Avoid the imperative `measure()` unless you need an on-demand, one-off measurement (e.g. measuring against the window for a tooltip).

```tsx
const [size, setSize] = useState<{ width: number; height: number }>();

const onLayout = useCallback((e: LayoutChangeEvent) => {
  const { width, height } = e.nativeEvent.layout;
  setSize(prev =>
    prev?.width === width && prev?.height === height ? prev : { width, height },
  );
}, []);
```

For a single primitive (e.g. just height) you can set it directly; the comparison only matters for object/array state where a new reference would re-render even when the values match.

## Consider (Not Yet in the Stack)

These are worth proposing when the use-case comes up, but they require adding a dependency — raise them, don't silently introduce them:

- **Native bottom tabs** — we currently use the JS `@react-navigation/bottom-tabs`. `@bottom-tabs/react-navigation` renders the real `UITabBarController` / native tabs (scroll-to-top on tab tap, correct insets, SF Symbols). A migration if/when native tab feel becomes a priority.
- **Native menus (zeego)** — for dropdown and long-press context menus, `zeego` wraps the native menu APIs (accessibility + platform UX for free) instead of an absolutely-positioned JS `View`. Consider it when building a real context/dropdown menu.
