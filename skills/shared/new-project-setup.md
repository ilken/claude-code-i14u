# New Project Setup — Reference Blueprint

Use this skill when creating a new project from scratch. It documents the opinionated stack and folder structure derived from `plai-agent`. Deviate where the domain requires it, but treat this as the default starting point.

---

## Folder Structure

```
project-root/
├── backend/                    # NestJS API server
├── web/                        # Next.js frontend
├── certs/                      # SSL certificates (if needed)
├── .claude/                    # Claude Code config
├── .husky/                     # Git hooks
├── .env                        # Local environment variables (gitignored)
├── .env.example                # Committed template with all required vars
├── .gitignore
├── .prettierrc
├── docker-compose.yml          # Postgres + Redis + backend
├── docker-compose.override.yml # Local dev overrides
├── package.json                # Root-level dev tooling only (husky, lint-staged, prettier)
└── yarn.lock
```

> Not a monorepo manager (no Turbo/Nx). `backend/` and `web/` each have their own `package.json`. Root package.json only manages shared dev tooling.

---

## Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | NestJS v10 + TypeScript v5 | Modular DI, decorator-based, GraphQL native |
| Database | PostgreSQL 16 + Prisma v5 | Type-safe ORM, migrations, Studio UI |
| Job queue | BullMQ v5 + Redis 7 | Distributed async jobs with retries |
| API layer | GraphQL (Apollo Server v5) | Code-first schema, flexible queries |
| Frontend framework | Next.js 16 + React 19 | App Router, server components |
| Client state | Jotai v2 | Lightweight atom-based state |
| Server state / data fetching | TanStack React Query v5 + graphql-request v7 | Server state cache + simple GraphQL client |
| Styling | Tailwind CSS v3 + PostCSS | Utility-first, custom design tokens |
| Backend testing | Jest v30 + ts-jest | Unit + integration tests |
| Frontend testing | Jest + Playwright | Unit + E2E |
| Linting | ESLint v9 + Prettier v3 | Consistent code style |
| Containers | Docker/Podman Compose | Dev parity with production |
| Package manager | Yarn v1 | Stable lockfile |
| AI integration | @anthropic-ai/sdk (latest) | Claude API access |
| Validation | Zod | Schema validation + env config |
| HTTP client | Axios | External API calls from backend |

---

## Backend Structure

```
backend/
├── src/
│   ├── apps/
│   │   ├── api/                # GraphQL API entry point
│   │   ├── queue-consumer/     # BullMQ job processor
│   │   └── scheduler/          # Cron-like task scheduler
│   ├── config/                 # Env validation (Zod), app config
│   ├── global/                 # Shared services (PrismaService, etc.)
│   ├── {feature}/              # Feature modules (one per domain concept)
│   │   ├── {feature}.module.ts
│   │   ├── {feature}.service.ts
│   │   ├── {feature}.resolver.ts  (if GraphQL)
│   │   └── {feature}.types.ts
│   ├── app.module.ts           # Root module
│   ├── main.ts                 # App entry point
│   └── schema.gql              # Auto-generated GraphQL schema
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   └── {feature}/              # Integration tests
├── Dockerfile                  # Multi-stage: base → dev → builder → production
├── package.json
├── tsconfig.json
├── jest.config.ts
└── eslint.config.js
```

### Backend Key Packages
```json
{
  "@nestjs/apollo": "^13",
  "@nestjs/bullmq": "^10",
  "@nestjs/config": "^3",
  "@nestjs/core": "^10",
  "@nestjs/graphql": "^13",
  "@nestjs/schedule": "^6",
  "@nestjs/terminus": "^10",
  "@prisma/client": "^5",
  "@anthropic-ai/sdk": "latest",
  "bullmq": "^5",
  "axios": "^1",
  "graphql": "^16",
  "class-validator": "^0.15",
  "class-transformer": "^0.5",
  "zod": "^4"
}
```

### Backend TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "paths": {
      "global/*": ["src/global/*"],
      "config/*": ["src/config/*"],
      "apps/*": ["src/apps/*"]
      // Add a path alias per feature module
    }
  }
}
```

### Backend Scripts
```bash
yarn build              # Compile TypeScript
yarn start:dev          # Hot reload + docker deps
yarn db:migrate         # Run pending migrations
yarn db:migrate:dev     # Interactive migration (creates migration files)
yarn db:generate        # Regenerate Prisma client
yarn db:seed            # Run seed script
yarn db:studio          # Launch Prisma Studio
yarn lint               # Check code
yarn lint:fix           # Fix linting errors
yarn format             # Prettier format
yarn test               # Unit tests
yarn test:e2e           # End-to-end tests
```

---

## Frontend Structure

```
web/
├── app/                        # Next.js App Router
│   ├── {route}/
│   │   └── page.tsx
│   ├── globals.css             # Tailwind base + custom CSS vars
│   ├── layout.tsx              # Root layout (fonts, dark mode, providers)
│   └── page.tsx                # Root page (redirect to dashboard)
├── components/                 # Shared reusable components
├── hooks/                      # Custom data-fetching hooks
│   └── use-{resource}.ts       # e.g. use-fixtures.ts, use-betslips.ts
├── lib/
│   ├── api.ts                  # GraphQL client (graphql-request)
│   ├── atoms.ts                # Jotai state atoms
│   ├── graphql.ts              # GraphQL query/mutation helpers
│   └── query-client.tsx        # React Query provider setup
├── public/                     # Static assets
├── e2e/                        # Playwright tests
├── test/                       # Jest unit tests
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── jest.config.ts
```

### Frontend Key Packages
```json
{
  "next": "16",
  "react": "19",
  "react-dom": "19",
  "@tanstack/react-query": "^5",
  "graphql-request": "^7",
  "jotai": "^2",
  "tailwindcss": "^3",
  "graphql": "^16"
}
```

### Frontend TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  }
}
```

---

## Design System

Dark mode first. Custom Tailwind tokens:

```ts
// tailwind.config.ts
colors: {
  primary: '#90cdff',      // Blue — primary actions, links
  secondary: '#ffb4a8',    // Coral — secondary / warning states
  tertiary: '#00e639',     // Green — success / positive indicators
}
```

**Typography**:
- Headlines: Space Grotesk (Google Fonts)
- Body / labels: Inter (Google Fonts)
- Icons: Material Symbols

**HTML setup**:
```tsx
// layout.tsx
<html lang="en" className="dark">
```

---

## Environment Variables

`.env.example` at root — commit this, never commit `.env`:

```env
# Postgres
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

# Prisma
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Backend
BACKEND_PORT=3001

# External APIs (add project-specific keys below)
ANTHROPIC_API_KEY=
```

**Default ports**:
- Backend (NestJS): 3001
- Frontend (Next.js): 3000
- PostgreSQL: 5432
- Redis: 6379

---

## Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      target: production
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
```

### Dockerfile (backend, multi-stage)
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM base AS development
COPY . .
CMD ["yarn", "start:dev"]

FROM base AS builder
COPY . .
RUN yarn build

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nestjs
CMD ["node", "dist/main"]
```

---

## Git & Code Quality

**Husky + lint-staged** (root `package.json`):
```json
{
  "lint-staged": {
    "backend/src/**/*.ts": ["prettier --write", "eslint --fix"],
    "web/**/*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "web/**/*.css": ["prettier --write"]
  }
}
```

**.prettierrc**:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

**Branch naming**: `{user}/{ticket-id}-{slug}` (e.g. `ilken/proj-42-add-auth`)

**Commit format**: `type(ticket): description` in imperative present tense, max 72 chars.

---

## Scaffold Checklist

When starting a new project, work through these in order:

1. [ ] Init git repo + create `main` branch
2. [ ] Root `package.json` with husky + lint-staged + prettier
3. [ ] `.env.example` with all required vars
4. [ ] `docker-compose.yml` (postgres + redis)
5. [ ] `backend/` — NestJS scaffold (`nest new backend --package-manager yarn`)
6. [ ] Backend: install core packages (prisma, bullmq, apollo, zod, anthropic sdk)
7. [ ] Backend: configure Prisma schema + initial migration
8. [ ] Backend: set up three app layers (api, queue-consumer, scheduler)
9. [ ] Backend: add TypeScript path aliases to tsconfig
10. [ ] Backend: configure Zod env validation
11. [ ] Backend: multi-stage Dockerfile
12. [ ] `web/` — Next.js scaffold (`yarn create next-app web --typescript --tailwind --app --no-src-dir`)
13. [ ] Web: install react-query, graphql-request, jotai
14. [ ] Web: configure Tailwind with custom design tokens (colors, fonts)
15. [ ] Web: set up `lib/api.ts`, `lib/query-client.tsx`, `lib/atoms.ts`
16. [ ] Web: add dark mode to root layout
17. [ ] Root: add Husky hooks + lint-staged
18. [ ] Verify `docker compose up` starts all services cleanly
