# Prisma Best Practices (NestJS)

---

## Module Setup

```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// prisma/prisma.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Mark as `@Global()` so every module that imports `PrismaModule` once (in `AppModule`) gets `PrismaService` without re-importing.

---

## Service Pattern

Keep Prisma calls inside services — never in resolvers or controllers. The service is the only place that knows about the database shape.

```typescript
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
```

---

## Single findMany Pattern

A single `findMany` with an optional args object is more maintainable than multiple specialized finders. Adding a new filter is a one-line change instead of a new method.

```typescript
export type FindManyUsersArgs = {
  roleId?: number;
  isActive?: boolean;
  skip?: number;
  take?: number;
};

async findMany(args: FindManyUsersArgs = {}): Promise<User[]> {
  return this.prisma.user.findMany({
    where: {
      ...(args.roleId    !== undefined && { roleId: args.roleId }),
      ...(args.isActive  !== undefined && { isActive: args.isActive }),
    },
    ...(args.skip !== undefined && { skip: args.skip }),
    ...(args.take !== undefined && { take: args.take }),
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## Error Handling

Catch Prisma errors at the service boundary and convert to domain/HTTP exceptions.

```typescript
import { Prisma } from '@prisma/client';

async create(data: CreateUserDto): Promise<User> {
  try {
    return await this.prisma.user.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') throw new ConflictException('Email already exists');
      if (error.code === 'P2025') throw new NotFoundException('Record not found');
    }
    throw error;
  }
}
```

Common codes: `P2002` unique violation, `P2025` not found, `P2003` foreign key violation.

---

## Transactions

Use `$transaction` when multiple writes must succeed or fail together.

```typescript
async transferCredits(fromId: number, toId: number, amount: number) {
  return this.prisma.$transaction(async (tx) => {
    const from = await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    if (from.balance < 0) throw new BadRequestException('Insufficient balance');

    return tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  });
}
```

---

## Type Safety

Use Prisma-generated input types instead of writing them manually.

```typescript
import { Prisma } from '@prisma/client';

type CreateInput = Prisma.UserCreateInput;
type UpdateInput = Prisma.UserUpdateInput;
```

---

## Raw Queries — Escape Hatch

For JOINs, aggregates, or complex GROUP BY that Prisma can't express cleanly:

```typescript
// $queryRaw for SELECT
const results = await this.prisma.$queryRaw<{ id: number; count: bigint }[]>`
  SELECT u.id, COUNT(p.id) as count
  FROM "User" u
  LEFT JOIN "Post" p ON p."userId" = u.id
  WHERE u."isActive" = true
  GROUP BY u.id
`;

// $executeRaw for INSERT/UPDATE/DELETE
await this.prisma.$executeRaw`
  UPDATE "User" SET "lastSeenAt" = NOW() WHERE id = ${userId}
`;
```

Use tagged template literals (not string interpolation) — Prisma handles parameterisation automatically, preventing SQL injection.

---

## Migrations

```bash
# Dev: create migration from schema diff
npx prisma migrate dev --name add_user_roles

# Production: apply pending migrations
npx prisma migrate deploy

# Regenerate client after schema changes
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

**Rules:**
- `migrate dev` locally, `migrate deploy` in CI/production
- Never edit migration files after they've been committed
- Always run `prisma generate` after schema changes — otherwise the TS types lag behind
- Never use `db push` in production (skips migration history)

---

## Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrator' },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

```bash
npx prisma db seed
```

---

## Anti-Patterns

- **Prisma calls in resolvers/controllers** — always go through a service
- **`findUnique` without null check** — use `findUniqueOrThrow` or check explicitly
- **Unbounded queries** — always add `take` for user-facing list queries
- **String interpolation in raw queries** — use tagged template literals for safety
- **`db push` in production** — always use `migrate deploy`
