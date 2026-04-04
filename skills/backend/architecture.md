# NestJS Backend Architecture

Generic NestJS architecture following clean folder/file naming conventions. Project-specific knowledge belongs in the project's own `.claude/CLAUDE.md`.

---

## Folder Structure

```
src/
├── core/              # App-wide infrastructure (auth, redis, logger, database)
├── common/            # Generic reusable utilities (pipes, decorators, types, guards)
├── integrations/      # External/internal service wrappers (stripe, aws, third-party APIs)
├── modules/           # Domain-driven business feature modules
├── events/            # Event publishers and listeners
├── commands/          # CLI jobs, cron logic, one-off scripts
├── app.module.ts
└── main.ts
```

## Folder Rules

| Folder | Purpose | Examples |
|--------|---------|---------|
| `core/` | Shared internal infra — things every module needs | `auth/`, `redis/`, `logger/`, `prisma/` |
| `common/` | Lightweight utils with no business logic | `pipes/`, `decorators/`, `guards/`, `types/` |
| `integrations/` | API clients for external services | `stripe/`, `paytech/`, `aws/`, `openai/` |
| `modules/` | Core business features, one folder per domain concept | `user/`, `account/`, `payment/` |
| `commands/` | One-off or repeated jobs | `process-transactions.command.ts` |
| `events/` | Event-based architecture | `user-created/`, `payment-failed/` |

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Domain folder | **Singular** | `user/`, `account/`, `payment/` |
| Reusable code folder | **Plural** | `pipes/`, `utils/`, `decorators/` |
| Service | `[name].service.ts` | `user.service.ts` |
| Module | `[name].module.ts` | `auth.module.ts` |
| Controller | `[name].controller.ts` | `user.controller.ts` |
| Resolver (GraphQL) | `[name].resolver.ts` | `user.resolver.ts` |
| DTO | `[action]-[entity].dto.ts` | `create-user.dto.ts`, `update-account.dto.ts` |
| Entity/Model | `[name].entity.ts` | `user.entity.ts` |
| Guard | `[name].guard.ts` | `jwt.guard.ts`, `roles.guard.ts` |
| Pipe | `[name].pipe.ts` | `parse-int.pipe.ts` |
| Interceptor | `[name].interceptor.ts` | `logging.interceptor.ts` |
| External client | `[provider]-[entity].client.ts` | `stripe-payment.client.ts` |
| Unit test | Beside implementation | `user.service.spec.ts` |
| E2E test | `test/` or `e2e/` folder | `user.e2e-spec.ts` |

---

## Module Structure

Each domain module in `modules/` follows this internal layout:

```
modules/user/
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── user.module.ts
├── user.service.ts
├── user.resolver.ts        # if GraphQL
├── user.controller.ts      # if REST
├── user.entity.ts          # if using TypeORM/class-based entities
├── user.types.ts           # module-specific types/interfaces
└── user.service.spec.ts
```

---

## File Placement Decision Tree

- **Business feature** → `modules/[feature]/`
- **DTO** → `modules/[feature]/dto/`
- **Module-specific decorator/utility** → `modules/[feature]/utils/`
- **Global/shared decorator/utility** → `common/utils/`
- **Auth, database, redis config** → `core/`
- **External service wrapper** → `integrations/`
- **CLI job or cron** → `commands/`
- **Event publisher/listener** → `events/[event-name]/`

---

## Core Patterns

### Module bootstrap
```typescript
@Module({
  imports: [PrismaModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
```

### Service pattern
```typescript
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }
}
```

### DTO validation
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Config/env validation (Zod)
```typescript
// config/env.config.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const validateEnv = (config: Record<string, unknown>) => envSchema.parse(config);
```

---

## Anti-patterns to Avoid

- **Fat controllers** — business logic belongs in services, not controllers/resolvers
- **Cross-module imports without exports** — export only what other modules need
- **Putting everything in `common/`** — if it's business logic, it's a module
- **Skipping DTOs** — always validate input at the boundary
- **Hardcoding config** — all env vars go through the config module with Zod validation

---

## Key Principle

**Consistency > Perfection.** Standardized structure from day one prevents architectural debates. When in doubt, use the decision tree above.
