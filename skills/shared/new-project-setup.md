# New Project Setup — Reference Blueprint

Use this skill when creating a new project from scratch. It documents the opinionated stack and folder structure derived from `plai-agent`. Deviate where the domain requires it, but treat this as the default starting point.

---

## Folder Structure

```
project-root/
├── backend/                    # NestJS API server
│   └── .env.example            # Backend env template (DATABASE_URL, REDIS_*, API keys, PORT)
├── web/                        # Next.js frontend
│   └── .env.example            # Web env template (NEXT_PUBLIC_* vars)
├── certs/                      # SSL certificates (if needed)
├── .claude/                    # Claude Code config
├── .husky/                     # Git hooks
├── .gitignore
├── .prettierrc
├── docker-compose.yml          # Postgres + Redis + backend
├── docker-compose.override.yml # Local dev overrides
├── package.json                # Root-level dev tooling only (husky, lint-staged, prettier)
└── yarn.lock

> **No root `.env` or `.env.example`.** Each app owns its env file. Docker Compose reads `env_file: ./backend/.env` directly.
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

Dark mode first. Base brand: midnight background `#200F07`, pistachio text `#C5E384`, Montserrat font.

```ts
// tailwind.config.ts
colors: {
  background: '#200F07',
  'on-background': '#C5E384',
  'on-surface': '#C5E384',
  'on-surface-variant': '#9BB865',
  primary: '#C5E384',      // Pistachio — primary actions, links
  'on-primary': '#200F07',
  secondary: '#E8C97A',    // Warm amber — secondary states
  tertiary: '#F4A261',     // Warm orange — accents / highlights
  // Surface scale (warm dark, graduated from background)
  'surface-container-lowest': '#160A03',
  'surface-container-low': '#2A1509',
  'surface-container': '#32190C',
  'surface-container-high': '#3D2010',
  'surface-container-highest': '#4A2814',
  'surface-bright': '#5A3420',
  outline: '#7A6050',
  'outline-variant': '#4A3020',
}
fontFamily: {
  headline: ['Montserrat', 'sans-serif'],
  body: ['Montserrat', 'sans-serif'],
  label: ['Montserrat', 'sans-serif'],
}
```

**Typography**:
- All text: Montserrat (Google Fonts, weights 300–800)
- Icons: Material Symbols

**Google Fonts link**:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" />
```

**globals.css body defaults**:
```css
body {
  background-color: #200F07;
  color: #C5E384;
  font-family: 'Montserrat', sans-serif;
}
.glass-panel {
  background: rgba(61, 32, 16, 0.6);
  backdrop-filter: blur(12px);
}
```

**HTML setup**:
```tsx
// layout.tsx
<html lang="en" className="dark">
```

---

## Environment Variables

Each app owns its own `.env.example`. **Never put an `.env.example` at the repo root.**

`backend/.env.example` — commit this, never commit `backend/.env`:

```env
# Postgres (used by Docker Compose to initialise the database)
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

# Prisma — use localhost for local dev; Docker overrides to container hostname
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis — use localhost for local dev; Docker overrides REDIS_HOST to 'redis'
REDIS_HOST=localhost
REDIS_PORT=6379

# Backend
PORT=3001

# External APIs (add project-specific keys below)
ANTHROPIC_API_KEY=
```

`web/.env.example` — commit this, never commit `web/.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
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
# No root .env needed. Postgres, redis, and backend all read from backend/.env.
services:
  postgres:
    image: postgres:16-alpine
    env_file: ./backend/.env        # provides POSTGRES_USER / PASSWORD / DB to the container
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U <POSTGRES_USER>"]  # hardcode the user from your .env
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      target: development
    ports:
      - "3001:3001"
    env_file: ./backend/.env
    environment:
      # Override localhost URLs with container-internal hostnames
      DATABASE_URL: postgresql://<user>:<pass>@postgres:5432/<db>
      REDIS_HOST: redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
```

> **Only the backend gets a Dockerfile.** The web app is never containerised — it runs locally via `yarn dev`. Only add it to Docker Compose if you're running it in CI or production; for local dev, `cd web && yarn dev` is sufficient.

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
3. [ ] `backend/.env.example` (DATABASE_URL, REDIS_*, API keys, PORT) — **not at repo root**
4. [ ] `web/.env.example` (NEXT_PUBLIC_* vars) — **not at repo root**
5. [ ] `docker-compose.yml` (postgres + redis + backend; `env_file: ./backend/.env`)
6. [ ] `backend/` — NestJS scaffold (`nest new backend --package-manager yarn`)
7. [ ] Backend: install core packages (prisma, bullmq, apollo, zod, anthropic sdk)
8. [ ] Backend: configure Prisma schema + initial migration
9. [ ] Backend: set up three app layers (api, queue-consumer, scheduler)
10. [ ] Backend: add TypeScript path aliases to tsconfig
11. [ ] Backend: configure Zod env validation
12. [ ] Backend: multi-stage Dockerfile
13. [ ] `web/` — Next.js scaffold (`yarn create next-app web --typescript --tailwind --app --no-src-dir`)
14. [ ] Web: install react-query, graphql-request, jotai
15. [ ] Web: configure Tailwind with custom design tokens (colors, fonts)
16. [ ] Web: set up `lib/api.ts`, `lib/query-client.tsx`, `lib/atoms.ts`
17. [ ] Web: add dark mode to root layout
18. [ ] Root: add Husky hooks + lint-staged
19. [ ] Verify `docker compose up` starts backend + postgres + redis cleanly; start web with `yarn dev`
