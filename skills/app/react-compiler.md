# React Compiler (Adoption)

> **Status: coming soon.** We're adopting React Compiler. This skill is the adoption guide and the set of rules to follow so code is compiler-ready **now** — write to these even before it's switched on, and they cost nothing if it's already enabled.

React Compiler auto-memoizes components, callbacks, and computed values at build time. Once it's on and a component compiles cleanly, manual `React.memo` / `useMemo` / `useCallback` become redundant for that component. It **optimizes correct code; it does not fix incorrect code** — components that break the Rules of React are silently skipped (safe, but unoptimized).

Assumes React 19 with Hermes; check the project's `package.json` before trusting version-specific steps.

## Checklist (compiler-ready code)

- No mutation / side effects in the render body
- Shared values via `.get()` / `.set()`
- Functions destructured from hooks, not dotted into
- Function components only
- ESLint compiler rules clean before treating a component as optimized

## Enabling It (reference)

```bash
# Verify the codebase follows the Rules of React first
npx react-compiler-healthcheck@latest

# Expo SDK 54+: Babel is auto-wired; just install the plugin
npx expo install babel-plugin-react-compiler@beta
```

```jsonc
// app.json / app.config — turn it on
{ "expo": { "experiments": { "reactCompiler": true } } }
```

Always run the healthcheck before enabling, and prefer the setup path documented for our exact Expo SDK / React version over copying snippets. Expo runs the compiler on **app code only** (not `node_modules`), client bundles only.

### Incremental adoption

- **Scope to a directory** while rolling out: in `babel.config.js`, set `react-compiler.sources` to a predicate (`filename => filename.includes("src/screens/feature")`). Clear the Metro cache after changing Babel config.
- **Opt a file/component out** with the `"use no memo"` directive at the top of the function body — use it to temporarily skip a component that misbehaves, then fix the root cause and remove the directive. It's an escape hatch, not a fix.

## Rules to Follow Now (compiler-ready code)

These are the patterns that make code compile cleanly and stay correct under the compiler. Apply them regardless of whether it's enabled yet.

### 1. No mutation or side effects during render

The compiler (and React) assumes render is pure and idempotent. These opt a component out:

```tsx
// ❌ mutating a prop / state during render, or a render-time side effect
const Bad = ({ items }: Props) => {
  items.push("x");        // mutating props
  return <List data={items} />;
};
```

Mutate in event handlers/effects, never in the render body.

### 2. Reanimated shared values use `.get()` / `.set()`

The compiler can't track `.value` property access on shared values — it opts the component out. Use the v4 methods (this is already our animations convention — see [`animations.md`](./animations.md)).

```tsx
// ❌ count.value = count.value + 1;   // opts out of the compiler
// ✅
count.set(count.get() + 1);
```

### 3. Destructure functions from hooks early — don't dot into objects

When a callback calls a function off a hook's returned object, **destructure it** at the top of render. Dotting (`router.push(...)`) keys the compiler's memo cache on the whole object (which changes every render) and breaks memoization; a destructured function is a stable reference.

```tsx
// ❌ keys cache on the whole `navigation` object
const navigation = useNavigation();
const handlePress = () => navigation.navigate("Profile");

// ✅ stable reference
const { navigate } = useNavigation();
const handlePress = () => navigate("Profile");
```

This pairs with our existing hook rule that returned callbacks/objects are wrapped in `useCallback`/`useMemo` ([`typescript-react.md`](./typescript-react.md)) — both keep references stable.

### 4. Function components only

Class components are **not** optimized. We're already function-components throughout; keep it that way for any new code.

## After It's On: Removing Manual Memoization

Once the compiler is enabled and verified, you can **delete** `useMemo` / `useCallback` / `React.memo` that exist purely for referential stability — the compiler handles it. Remove them incrementally and verify with the profiler. Keep manual memoization only where it's load-bearing for correctness (e.g. a dependency a non-React system reads) — those are rare.

Don't pre-emptively strip memoization from code that isn't compiled yet (e.g. a directory excluded by the `sources` filter, or a `"use no memo"` file).

## What It Does NOT Replace

- **Atomic state (Jotai) / react-query** — the compiler reduces re-render *cost*, it doesn't change *what subscribes to what*. If profiling shows a broad store update waking unrelated subscribers, narrow the subscription; don't expect the compiler to fix it. See [`performance-audit.md`](./performance-audit.md) §A.
- **Profiling** — it's not a substitute for measuring. Verify wins with React DevTools render counts before/after.

## Common Pitfalls

- Not fixing ESLint (`eslint-plugin-react-compiler` / `eslint-config-expo` SDK 55+) violations first — the compiler **skips** flagged components, so you silently miss the optimization.
- Expecting it to fix bad patterns — it optimizes good code only.
- Forgetting it uses **shallow** comparison (like `memo`) for objects/arrays.
- Skipping `react-compiler-healthcheck` before enabling.
