---
name: backend-dev
description: NestJS backend conventions — module architecture, Zod env configuration, DTO/entity writing style, GraphQL resolvers and pagination, Prisma patterns and migrations, BullMQ queue processing, and testing with mockDeep. Use when writing or reviewing code in a NestJS backend project.
---

# Backend Dev — NestJS

Conventions for NestJS backend projects. Project-specific detail lives in each project's own CLAUDE.md — these docs cover the generic patterns.

Read only the docs relevant to the current task:

| Task involves | Read |
| --- | --- |
| New modules, file naming, structure | `architecture.md` — folder structure, naming, module patterns |
| Env vars, config | `configuration.md` — Zod env validation, config module |
| DTOs, entities, types | `data-objects.md` — DTO/entity style, primitive types |
| GraphQL schema, resolvers | `graphql.md` — enum registration, pagination, resolver structure |
| Database access, migrations | `prisma.md` — Prisma service, findMany pattern, transactions |
| Background jobs | `queue-processing.md` — BullMQ setup, processors, job options |
| Writing tests | `testing.md` — unit tests with mockDeep, integration + E2E |
| Documenting domain facts | `domain-knowledge.md` — template |
