# Prisma Best Practices & Migrations

## Model Structure

Custom models extend `PrismaCustomModel`:

```typescript
import { PrismaCustomModel } from 'global/prisma/models/prisma-custom.model';

@Injectable()
export class MyModel extends PrismaCustomModel {
  constructor(private readonly table: PrismaService['tableName']) {
    super();
  }
}
```

## Module Registration

```typescript
@Module({
  providers: [
    ...PrismaUtils.createInjectablePrismaCustomModel({
      provide: MyModel,
      callback: (prisma) => new MyModel(prisma.tableName),
    }),
    MyService,
  ],
})
export class MyModule {}
```

## Error Handling

```typescript
public async create(data: any) {
  try {
    return await this.table.create({ data });
  } catch (error) {
    this.handlePrismaError(error);
    throw error;
  }
}
```

## Query Methods

Models should expose a single `findMany` method with optional filter parameters instead of multiple specialised finders. Define a single args type with all optional where-clause fields:

```typescript
// Args type in module .types.ts
export type FindManyMyEntityArgs = {
  profileId?: number;
  chatChannelId?: number;
  roles?: MyRole[];
  hasRole?: boolean;
};

// Single findMany in model
public async findMany(args: FindManyMyEntityArgs): Promise<MyEntity[]> {
  const records = await this.table.findMany({
    where: {
      ...(args.profileId !== undefined ? { profileId: args.profileId } : {}),
      ...(args.chatChannelId !== undefined ? { chatRoomId: args.chatChannelId } : {}),
      ...(args.roles !== undefined ? { role: { in: args.roles } } : {}),
      ...(args.hasRole === true ? { role: { not: null } } : {}),
    },
  });
  return records.map((r) => this.buildEntity(r));
}
```

## Common Operations

```typescript
// Find
public async findById(id: number): Promise<Entity> {
  const record = await this.table.findUniqueOrThrow({ where: { id } });
  return new Entity(record);
}

// Create
public async create(data: CreateInput): Promise<Entity> {
  const record = await this.table.create({ data });
  return new Entity(record);
}

// Update
public async update(id: number, data: UpdateInput): Promise<Entity> {
  const record = await this.table.update({ where: { id }, data });
  return new Entity(record);
}
```

## Complex Queries -- QueryBuilderSql + pgPool

For queries involving JOINs, GROUP BY, aggregates, or raw SQL, use `QueryBuilderSql` with `this.pgPool` instead of `Prisma.sql` or `this.prisma.$queryRaw`.

- `QueryBuilderSql` generates parameterized `QueryConfig` objects via `.toPgQuery()`
- `this.pgPool` is available on all `PrismaCustomModel` subclasses
- Each query method should have a single purpose (separate `findMany` from `count`)
- Orchestration (`Promise.all`) belongs in the service, not the model

```typescript
import { QueryBuilderSql } from 'global/prisma/sql-query-builder/query-builder.sql';

// BAD -- raw Prisma.sql baked into pgPool
const result = await this.pgPool.query(Prisma.sql`
  SELECT ... FROM "Table" WHERE id IN (${Prisma.join(ids)})
`);

// GOOD -- QueryBuilderSql
const query = QueryBuilderSql.table('Table', 't')
  .selectRaw({ sql: 't.id', alias: 'id' })
  .whereIn('t.id', ids);
const result = await this.pgPool.query<RecordType>(query.toPgQuery());
```

Full example:

```typescript
public async complexQuery(args: ComplexQueryArgs): Promise<MyEntity[]> {
  const query = QueryBuilderSql.table('TableName', 't')
    .selectRaw(
      { sql: 't.id', alias: 'id' },
      { sql: 't.name', alias: 'name' },
    )
    .join('RelatedTable', 'rt', 'rt."tableId"', '=', 't.id')
    .whereIn('t."profileId"', args.profileIds)
    .groupBy('t.id')
    .orderByRaw('MAX(rt."createdAt") DESC')
    .offset(args.skip)
    .limit(args.take);

  const result = await this.pgPool.query<RecordType>(query.toPgQuery());
  return this.buildEntity(result.rows);
}
```

## Service Integration

```typescript
@Injectable()
export class MyService {
  constructor(private readonly myModel: MyModel) {}

  public async businessLogic(): Promise<Entity[]> {
    return await this.myModel.findMany({ where: { active: true } });
  }
}
```

## Type Safety

```typescript
import { Prisma } from '@prisma-generated/client';
type CreateInput = Prisma.TableNameCreateInput;
type UpdateInput = Prisma.TableNameUpdateInput;
type WhereInput = Prisma.TableNameWhereInput;
```

## Available Methods on PrismaCustomModel

- `this.prisma` -- PrismaService access
- `this.configuration` -- ConfigurationService access
- `this.handlePrismaError(error)` -- Error handling
- `this.isUniqueConstraintError(error, fields)` -- Constraint validation
- `this.isPrismaNotFoundError(error)` -- Not found detection

## Model Migration Pattern (implements -> extends)

When migrating older models:

```typescript
// Before
import { PrismaCustomModelType } from 'global/prisma/prisma.types';
export class MyModel implements PrismaCustomModelType {
  constructor(public readonly table: PrismaService['tableName']) {}
}

// After
import { PrismaCustomModel } from 'global/prisma/models/prisma-custom.model';
export class MyModel extends PrismaCustomModel {
  constructor(private readonly table: PrismaService['tableName']) {
    super();
  }
}
```

Key changes:
1. Import: `PrismaCustomModelType` -> `PrismaCustomModel`
2. Declaration: `implements` -> `extends`
3. Constructor: `public readonly` -> `private readonly` + `super()`
4. Injection: `createInjectableCustomModel()` -> `createInjectablePrismaCustomModel()`

Module registration migration:

```typescript
// Old
PrismaUtils.createInjectableCustomModel(MyModel, (prisma) => new MyModel(prisma.table));

// New
...PrismaUtils.createInjectablePrismaCustomModel({
  provide: MyModel,
  callback: (prisma) => new MyModel(prisma.table),
}),
```

## Database Migrations

The project uses PostgreSQL. Migrations MUST be created manually because `yarn db:migrate:local dev` requires the application and database to be running.

### Step 1: Update the Prisma Schema

Edit the relevant model file in `prisma/models/` to add, remove, or modify columns.

### Step 2: Create the Migration

Generate a UTC timestamp and create the migration directory with a SQL file:

```bash
# Generate timestamp
date -u +%Y%m%d%H%M%S

# Create the migration
mkdir -p prisma/migrations/{timestamp}_{snake_case_description}
```

Write PostgreSQL-compatible SQL in `prisma/migrations/{timestamp}_{snake_case_description}/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "TableName" ADD COLUMN "columnName" BOOLEAN NOT NULL DEFAULT false;
```

Use PostgreSQL-specific syntax when needed (e.g., `CREATE INDEX CONCURRENTLY`, `DO $$ ... $$` blocks, GIN/GiST indexes).

### Step 3: Regenerate Prisma Client Types

```bash
yarn db:generate
```

### Step 4: Verify

```bash
yarn code:tsc
```

### Constraints

- MUST NOT use `yarn db:migrate:local dev` (requires app to be running)
- MUST create the migration SQL file manually
- MUST use a UTC timestamp for the migration directory name
- MUST run `yarn db:generate` after schema changes
- MUST verify compilation with `yarn code:tsc`
