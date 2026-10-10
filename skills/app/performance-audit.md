# Performance Audit & Profiling

Audit-grade guide for diagnosing and fixing React Native performance problems: FPS/jank, re-renders, startup (TTI), bundle size, memory, and native cost. Use it to **run a structured perf audit** of a screen or the whole app, or to triage a specific complaint.

Assumed stack: **New Architecture (Fabric/TurboModules/Bridgeless), Hermes, Reanimated v4, FlashList v2** — check the project's `package.json` first. Several legacy fixes (bridge batching, Hermes mmap config) no longer apply — they're called out below.

## Run / Never

- Run `zipalign -c -P 16 -v 4 app-release.apk` before every Play release; without `-P 16` you check 4 KB. § H. Android Release Gate: 16 KB Page Alignment
- Report each audit area as baseline, finding, fix, re-measured metric; mark unverified findings "needs profiling". § Audit Deliverable

## The Golden Rule: Measure → Optimize → Re-measure → Validate

Never recommend `useMemo`, `useCallback`, `React.memo`, atomic state, or compiler changes **without a measured render or FPS problem.** Speculative memoization adds complexity and often makes things slower.

1. **Measure** — capture a baseline (FPS, re-render count, TTI, bundle size) for the target interaction.
2. **Optimize** — apply one targeted fix.
3. **Re-measure** — run the same measurement.
4. **Validate** — confirm the number moved (e.g. FPS 45→60, TTI 3.2s→1.8s). If it didn't, **revert** and try the next hypothesis.

**Measurement hygiene (or the numbers lie):**
- Profile with **JS dev mode OFF** and a **release/production build** — dev mode is artificially slow.
- Use a **real device**, ideally a low-end one. Simulators don't reflect real perf.
- Run **multiple times** — FPS varies run to run.
- Measure the **target interaction itself**. Component-tree depth/count are context, not evidence.

## Priority Matrix

| Priority | Area | Impact | Start with |
|---|---|---|---|
| 1 | FPS & re-renders | CRITICAL | Perf Monitor → React DevTools profiler |
| 2 | List scroll jank | CRITICAL | FlashList/LegendList config + flat `renderItem` |
| 3 | Bundle size | CRITICAL | `source-map-explorer` / Expo Atlas |
| 4 | TTI (startup) | HIGH | `react-native-performance` markers (cold start only) |
| 5 | Memory | MEDIUM-HIGH | RN DevTools Memory tab |
| 6 | Native cost | HIGH | Xcode Instruments / Android Studio profiler |

## A. FPS & Re-renders (start here)

**Measure FPS:** Dev Menu → **Perf Monitor** (shows UI-thread FPS, JS-thread FPS, RAM). On Android, **Flashlight** (`flashlight measure`) gives a 0–100 score + FPS graph + JSON export for CI.

Read the two threads separately:
- **UI FPS drops, JS fine** → native rendering: too many views / deep layouts / heavy native animation.
- **JS FPS drops, UI fine** → JS blocking: expensive re-renders or a long synchronous function.
- **Both drop** → start with JS profiling.

| FPS | Perception | Action |
|---|---|---|
| 55–60 | Smooth | Acceptable |
| 45–55 | Slight stutter | Investigate |
| 30–45 | Noticeable jank | Optimize |
| <30 | Very choppy | Critical |

Budget: 60fps = 16.6ms/frame, 120fps = 8.3ms/frame.

**Find the cause:** React Native DevTools → Profiler. Record the interaction, then look at the commit timeline, re-render counts, and the heaviest commits. Fixes, in order:
- Cascading re-renders from a broad Context/store value → **atomic state (Jotai)** with narrow subscriptions, or **React Compiler** (see [`react-compiler.md`](./react-compiler.md)) for automatic memoization.
- A single value driving an expensive subtree → **`useDeferredValue`** (keep input responsive) — and wrap the expensive subtree in `memo` or it re-renders from the parent anyway.
- Stale-closure / wasted work proven by the profiler → targeted `useCallback`/`useMemo`. Not before.

## B. Lists

Most scroll jank is list-shaped. The construction rules (flat `renderItem`, callbacks-as-props, no inline styles, lightweight primitives in items, image `backgroundColor`) live in [`performance.md`](./performance.md). For audits, also check:

- **Virtualize** — a long `ScrollView.map()` must become `FlashList` or `LegendList`. This alone often takes a list from single-digit FPS to 60.
- **FlashList v2 caveat** — `estimatedItemSize` is **deprecated in v2** (auto-measured). Do **not** flag it as missing; flag it if it's still being passed.
- **Heterogeneous lists** — give mixed row types a stable `getItemType` so the recycler pools by type instead of remounting on every type change.
- **Expensive per-item work** — derive/compute outside `renderItem` or memoize it; never run a query/mutation hook per row.

## C. Bundle Size

**Measure:** build a production bundle and visualize it.

```bash
# Bare RN
npx react-native bundle --entry-file index.js --bundle-output out.js \
  --platform ios --sourcemap-output out.js.map --dev false --minify true
npx source-map-explorer out.js --no-border-checks
```

For Expo, use **Expo Atlas** (`EXPO_ATLAS=1 npx expo start`) to inspect the module graph.

Common wins:
- **Barrel imports** (`import { X } from './components'`) pull in and evaluate the whole index. Import direct paths (`import X from './components/X'`). Same for libraries — `import format from 'date-fns/format'`, not `import { format } from 'date-fns'` — unless tree-shaking is proven to handle it.
- **Tree shaking** — Expo SDK 52+ supports experimental import/export removal; verify it's on before relying on it.
- **Intl polyfills** — Hermes has native `Intl` support; remove polyfills only after confirming the specific API/method coverage you use.
- **R8** (Android) shrinks native code in release builds.

## D. TTI / Startup

**Measure** with `react-native-performance` markers, and **only measure cold starts** (exclude warm/hot/prewarm). Fixes:
- **Native navigation** — already in place (`@react-navigation/native-stack`). Keep new flows on native-stack.
- **Defer non-critical work** off the critical path (`InteractionManager`, lazy screens).
- **Preload** expensive screens before navigating to them when the next step is predictable.
- **Hermes bundle compression (Android)** — RN **0.79+ defaults to uncompressed** Android JS bundles (enables mmap automatically). The old manual `androidResources.noCompress += ["bundle"]` hack is **not needed** on our version — just verify it's not been disabled.

## E. Native Cost

Profile with **Xcode Instruments → Time Profiler** (iOS) or **Android Studio → CPU Profiler**. On the New Architecture:
- Prefer **async** TurboModule methods over sync — sync calls block the JS thread.
- Move heavy native work to **background threads**.
- **View flattening** — deeply nested `View`s inflate the native hierarchy; flatten where possible.

## F. Memory Leaks

**Measure:** RN DevTools → **Memory** tab → "Allocation instrumentation on timeline". Record, exercise the flow (navigate in/out of a screen repeatedly), stop. Allocations that never free (stay "blue") are suspects — confirm via **retained size** (large retained + small shallow size = a closure holding big objects), don't conclude from allocation color alone.

By far the most common RN leak is a **missing `useEffect` cleanup**:

```tsx
// ❌ listener/timer never removed
useEffect(() => {
  const sub = emitter.addListener("event", handler);
}, []);

// ✅
useEffect(() => {
  const sub = emitter.addListener("event", handler);
  return () => sub.remove();
}, []);
```

Same for `setInterval`/`setTimeout` (`clearInterval`), subscriptions, and animation listeners. Re-profile the same flow after fixing — memory should return to a stable baseline after GC.

## G. TextInput Lag

On the New Architecture, controlled `TextInput` flicker is largely resolved, so this is an **escape hatch**, not a default: if a specific input lags on low-end devices, switch from controlled (`value`) to uncontrolled (`defaultValue` + `onChangeText`) so native owns each keystroke. Keep it **controlled** when React must mask/transform/validate the value on every keystroke. For expensive search-as-you-type, pair with `useDeferredValue` (section A).

## H. Android Release Gate: 16 KB Page Alignment

Google Play requires apps targeting Android 15+ to support **16 KB page sizes** on 64-bit devices. RN 0.79+ ships aligned core binaries, but **third-party native libraries (`.so`) may not be** — verify before every Play release:

```bash
zipalign -c -P 16 -v 4 app-release.apk   # -P 16 is required; without it you check 4 KB
```

If a 64-bit lib (`arm64-v8a`, `x86_64`) reports misaligned, trace it (`find node_modules -name "lib*.so"`), then update/replace the dependency — repackaging alone won't fix it. Best caught in CI, not by Play Store rejection.

## Audit Deliverable

When running a full audit, report per area: **baseline metric → finding → fix → re-measured metric**. Flag anything that's CRITICAL/HIGH but unverified as "needs profiling" rather than asserting it. Don't recommend a fix you haven't tied to a measurement.

## Further Reading

Based on Callstack's "Ultimate Guide to React Native Optimization" and the Vercel/Callstack React Native skills — see [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills) for the full reference set (per-topic deep dives, profiling screenshots, CI integration).
