---
name: app-dev
description: React Native / Expo app development conventions — MVVM architecture, TypeScript and React Query hook patterns, theme-based styling, performance budgets, testing, Expo Router navigation, Stream Chat, A/B testing, and design-to-code. Use when writing or reviewing code in a React Native or Expo project.
---

# App Dev — React Native / Expo

Conventions for React Native / Expo projects. Project-specific detail lives in each project's own CLAUDE.md — these docs cover the generic patterns.

Read only the docs relevant to the current task:

| Task involves | Read |
| --- | --- |
| New modules, screens, file placement | `architecture.md` — directory structure, MVVM, component/provider conventions |
| Hooks, mutations, queries, TS types | `typescript-react.md` — hook patterns (mutation, infinite query, safe ops), React Query |
| Styling, colors, spacing | `styling.md` — theme system, StyleSheet patterns |
| Lists, animations, images, bundle size | `performance.md` — FPS, TTI, list rules, Reanimated, expo-image |
| Writing tests | `testing.md` — utils/transformer tests, renderHook, async timers |
| Routing, deep links, modals | `navigation.md` — Expo Router, type-safe params |
| Chat features | `chat-navigation.md` — Stream Chat setup, channels, unread counts |
| Experiments / feature flags | `ab-testing.md` — ABTest provider, Statsig workflow |
| Implementing from designs/screenshots | `design-to-code.md` — token mapping, common patterns |
| Figma links in the task | `figma-workflow.md` — extracting design context |
