---
name: web-dev
description: Next.js web app conventions — App Router architecture, server vs client components, graphql-request + TanStack Query data layer, Tailwind + shadcn/ui styling, Jest/RTL/Playwright testing, and web security (XSS, CSRF, auth guards). Use when writing or reviewing code in a Next.js project.
---

# Web Dev — Next.js

Conventions for Next.js (App Router) projects. Project-specific detail lives in each project's own CLAUDE.md — these docs cover the generic patterns.

Read only the docs relevant to the current task:

| Task involves | Read |
| --- | --- |
| New routes, components, file placement | `architecture.md` — App Router structure, server vs client components |
| Data fetching, hooks, codegen | `graphql-react-query.md` — graphql-request + TanStack Query v5 |
| Styling, components | `styling.md` — Tailwind, shadcn/ui, tokens, cn() helper |
| Writing tests | `testing.md` — Jest, RTL, Playwright patterns |
| Auth, input handling, anything user-facing | `security.md` — XSS, CSRF, auth guards, secret boundaries |

For UI design quality (visual style, motion, brand), also use the `web-ui-design` skill.
