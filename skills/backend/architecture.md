# Architecture & Coding Standards

## Technology Stack

- Language: Node.js, TypeScript
- Framework: NestJS
- Database: PostgreSQL via Prisma
- Cache/Queue: Redis, Bull/BullMQ
- Storage: AWS S3

## Module Organization

### Domain Modules

Location: `src/` (root path). Encapsulate business logic.

```
src/
├── domain-module/
│   ├── domain-module.module.ts
│   ├── domain-module.service.ts
│   ├── domain-module.types.ts
│   ├── sub-module/
│   │   ├── sub-module.module.ts
│   │   └── sub-module.service.ts
```

Rules:
- Must be self-contained in a single folder
- Must expose functionality only through services
- May depend on other domain modules when needed
- May contain submodules relevant to the domain
- Submodules must not be used directly by other modules

### App Modules

Location: `src/apps/`. Entry points for AWS services and external interactions.

- **HTTP API** (`src/apps/api/`) -- Handle HTTP requests, define routes and controllers, use guards for authentication
- **Queue Consumer** (`src/apps/queue-consumer/`) -- Process domain-registered queues, one consumer per queue type
- **CRON/Scheduler** (`src/apps/scheduler/`) -- Handle scheduled tasks, define CRON patterns

Rules:
- Must only import domain modules they explicitly need
- Must handle external interactions (HTTP, Queue Processing, CRON)

### Global Module

Location: `src/global/`. Provide shared functionality across all app modules.

```
src/global/
├── global.module.ts
├── third-party-service/
│   ├── third-party-service.module.ts
│   ├── third-party-service.service.ts
│   └── third-party-service.types.ts
```

Rules:
- Must be registered in `src/global/global.module.ts`
- Must use `@Global()` decorator
- Must be wrappers for third-party services

## Domain Module Creation

### Core Files

Every domain module requires:
- `my-domain.module.ts` -- Module definition
- `my-domain.service.ts` -- Service implementation
- `my-domain.types.ts` -- Type definitions

### Module Definition

```typescript
import { Module } from '@nestjs/common';
import { MyDomainService } from './my-domain.service';

@Module({
  providers: [MyDomainService],
  exports: [MyDomainService],
})
export class MyDomainModule {}
```

### Service Implementation

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyDomainService {
  // Service methods
}
```

### Submodule Creation

- Must create subdirectory for each submodule
- Must include module, service, and types files
- Must import submodules in main domain module

### Queue Integration

- Must follow queue naming convention with domain name prefix (e.g., `MY_DOMAIN_QUEUE`)

### Testing Requirements

- Unit tests in `src/my-domain/__test__/`
- E2E tests in `test/e2e/my-domain/`

## Queue System

### Domain Module Side

Register queues in domain modules with domain-prefixed names:

```typescript
@Module({
  imports: [BullModule.registerQueue({ name: 'DOMAIN_MODULE_QUEUE' })],
  providers: [DomainModuleService],
})
export class DomainModule {}
```

### App Module Side

- Queue consumers must be App Modules in `src/apps/queue-consumer/`
- Must process queues registered by domain modules

### Background Tasks

- CRON jobs must be App Modules in `src/apps/scheduler/`
- Schedule configuration must belong in App Modules only

## Coding Standards

### Architecture Principles

- Must follow NestJS framework coding style
- Must use object-oriented programming
- Must follow SOLID design principles
- Must prefer iteration and modularization over duplication
- Must prefer composition over inheritance

### Code Quality

- Must use descriptive names for classes, methods, and variables
- Must never use inline types in method signatures -- all argument types and return types must be named types defined in the module's `.types.ts` file
- Must never define local `type` aliases inside method bodies -- extract them to the `.types.ts` file
- Must not create methods, types, or code speculatively -- only add them when there is an actual caller (YAGNI)
- Must not expose models outside their module
- Must use services as interfaces between modules

### Event Handling

- Must place all event listeners in the `event-listener` module
- Must handle heavy processing tasks through queue processors
- Must not process heavy tasks directly in event listeners

### Database Access

- Must not use Prisma service to access tables from other modules
- Must use respective module services to request data from other modules

## Naming Conventions

### Files

- Must use kebab-case naming convention
- Allowed extensions: `.module.ts`, `.service.ts`, `.controller.ts`, `.types.ts`, `.job.ts`

### Classes

- Must use PascalCase (e.g., `MyService`)

### Methods and Properties

- Must use camelCase (e.g., `getValue()`)

### Constants

- Must use ALL_CAPS (e.g., `MAX_ATTEMPTS`)

## Import Paths

Must use ESLint relative paths for all imports. Must not use `../` or `./` relative paths.

```typescript
// Correct
import { MyService } from 'my-module/my.service';
import { MyType } from 'my-module/my.types';
import TestingApp from 'test/jest/test.app.jest';

// Incorrect
import { MyService } from '../../../my-module/my.service';
import { MyType } from './my.types';
```

## Key Principles

1. Domain modules focus on business logic
2. App modules handle application setup
3. Global modules provide shared services
4. Queue consumers must exist in App QueueConsumer
5. Cron tasks must exist in App Scheduler
6. Submodules must not be imported directly
7. All functionality must be exposed through services
8. Types must be in `.types.ts` files
9. Global modules must be registered in global.module.ts
10. App modules must minimize domain module dependencies
