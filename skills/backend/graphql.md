# GraphQL Patterns

## Enum Registration

When a Prisma enum is used as a `@Field()` type in any GraphQL object, input, or args class, it **must** be registered in `src/apps/http-api/http-api-enums.types.ts`.

Without registration the enum won't appear in `schema.gql` and GraphQL queries will fail at runtime.

### Steps

1. Import the enum from `@prisma-generated/client`
2. Call `registerEnumType` with a matching `name`
3. Update `src/schema.gql` with the corresponding `enum` block (alphabetically sorted)

```typescript
// src/apps/http-api/http-api-enums.types.ts
import { ChatRoomRole } from '@prisma-generated/client';

registerEnumType(ChatRoomRole, {
  name: 'ChatRoomRole',
});
```

```graphql
# src/schema.gql (alphabetical position)
enum ChatRoomRole {
  ADMIN
  MODERATOR
}
```

### Checklist

- Enum imported in `http-api-enums.types.ts`
- `registerEnumType` call added
- `schema.gql` updated with the enum definition

## At-Least-One-Required Field Validation

When a GraphQL Args or Input class has two mutually optional fields where **at least one must be provided**, enforce this at the class-validator level using `@ValidateIf` -- never with manual if-checks in the resolver.

Use `@ValidateIf` on each field to activate its validator only when the other field is absent. When both are absent, both validators fire on `undefined` and reject the request.

Do **not** add `@IsOptional()` to either field -- it would bypass the `@ValidateIf` guard.

```typescript
// GOOD -- validation enforced by class-validator
@ArgsType()
export class GetResourceArgs {
  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.externalId == undefined)
  @IsInt()
  declare resourceId?: number;

  @Field(() => String, { nullable: true })
  @ValidateIf((o) => o.resourceId == undefined)
  @IsString()
  declare externalId?: string;
}

// Resolver: no manual check needed
public async getResource(@Args() args: GetResourceArgs) {
  const entity = args.resourceId
    ? await this.service.findById({ resourceId: args.resourceId })
    : await this.service.findByExternalId({ externalId: args.externalId! });
  // ...
}
```

```typescript
// BAD -- redundant manual check in resolver
public async getResource(@Args() args: GetResourceArgs) {
  if (!args.resourceId && !args.externalId) {
    throw SomeError.invalidInput('...');
  }
  // ...
}

// BAD -- @IsOptional defeats the @ValidateIf guard
@Field(() => String, { nullable: true })
@ValidateIf((o) => o.resourceId == undefined)
@IsString()
@IsOptional()   // <-- allows both fields to be undefined
declare externalId?: string;
```

## Paginated GraphQL Query with Profile Hydration

A recurring pattern for exposing a paginated list of domain entities enriched with profile information. The pattern spans five layers: Args, GraphQL Objects, Model, Service chain, and Resolver.

### 1. Args Class

Create in `src/apps/http-api/resolvers/<domain>/args/`.

Extend `PaginationArgs` (omitting `cursor`) and add required filter fields. Follow the `declare` keyword convention.

```typescript
import { ArgsType, Field, Int, OmitType } from '@nestjs/graphql';
import { PaginationArgs } from 'apps/http-api/objects/common/pagination.args';
import { IsInt, IsString, ValidateIf } from 'class-validator';

@ArgsType()
export class GetMyEntitiesArgs extends OmitType(PaginationArgs, ['cursor']) {
  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.externalId == undefined)
  @IsInt()
  declare entityId?: number;

  @Field(() => String, { nullable: true })
  @ValidateIf((o) => o.entityId == undefined)
  @IsString()
  declare externalId?: string;
}
```

### 2. GraphQL Object Types

Create in `src/apps/http-api/objects/<domain>/`.

**Item Object** -- wraps the entity with a hydrated profile:

```typescript
@ObjectType('MyEntityItem')
export class MyEntityItemObject {
  @Field(() => PublicProfileObject)
  declare profile: PublicProfileObject;

  constructor(profile: PublicProfileObject) {
    this.profile = profile;
  }

  public static fromEntity(
    entity: MyEntity,
    profile: HydratedProfileEntity,
  ): MyEntityItemObject {
    return new MyEntityItemObject(
      PublicProfileObject.fromEntity(profile),
    );
  }
}
```

**Paginated Wrapper** -- standard `data` + `total`:

```typescript
@ObjectType('PaginatedMyEntities')
export class PaginatedMyEntitiesObject {
  @Field(() => [MyEntityItemObject])
  data: MyEntityItemObject[];

  @Field(() => Int)
  total: number;

  constructor(data: MyEntityItemObject[], total: number) {
    this.data = data;
    this.total = total;
  }
}
```

### 3. Model Layer

Add `skip`, `take`, and `orderBy` to the model's `findMany`. Follow the single-findMany pattern:

```typescript
const records = await this.table.findMany({
  where: { /* filters */ },
  orderBy: [/* ordering */],
  ...(args.skip !== undefined ? { skip: args.skip } : {}),
  ...(args.take !== undefined ? { take: args.take } : {}),
});
```

Extend the existing `FindManyXxxArgs` type with optional `skip` and `take` fields in the module's `.types.ts` file.

### 4. Service Chain

Expose the model method through the service chain. Each layer is a simple pass-through delegate:

```typescript
public async findManyMyEntities(
  args: FindManyMyEntitiesArgs,
): Promise<MyEntity[]> {
  return this.subService.findManyMyEntities(args);
}
```

Reuse existing `count` methods for the `total` field when available.

### 5. Resolver

Fetch entities + count in parallel, then hydrate profiles:

```typescript
@Query(() => PaginatedMyEntitiesObject)
public async getMyEntities(
  @Args() args: GetMyEntitiesArgs,
): Promise<PaginatedMyEntitiesObject> {
  const parent = args.entityId
    ? await this.service.findById({ entityId: args.entityId })
    : await this.service.findByExternalId({ externalId: args.externalId! });

  const [entities, total] = await Promise.all([
    this.service.findManyMyEntities({
      parentId: parent.id,
      skip: args.skip,
      take: args.take,
    }),
    this.service.countMyEntities({ parentId: parent.id }),
  ]);

  const objects = await this.buildMyEntityObjects(entities);
  return new PaginatedMyEntitiesObject(objects, total);
}
```

**Profile hydration helper** -- extract profileIds, bulk-fetch hydrated profiles, zip back:

```typescript
private async buildMyEntityObjects(
  entities: MyEntity[],
): Promise<MyEntityItemObject[]> {
  if (entities.length === 0) return [];

  const profileIds = entities.map((e) => e.profileId);
  const profiles = await this.profileService.findManyHydratedProfiles({
    profileId: profileIds,
    moderation: 'medium',
  });
  const profilesById = new Map(profiles.map((p) => [p.id, p]));

  return entities.reduce<MyEntityItemObject[]>((acc, entity) => {
    const profile = profilesById.get(entity.profileId);
    if (profile) {
      acc.push(MyEntityItemObject.fromEntity(entity, profile));
    }
    return acc;
  }, []);
}
```

### 6. Schema Update

Add the new types and query to `src/schema.gql` in alphabetical order. If any new Prisma enums are used, register them in `src/apps/http-api/http-api-enums.types.ts`.

### Reference Implementations

- Args: `src/apps/http-api/resolvers/chat-channel/args/get-chat-channel-members.args.ts`
- Object: `src/apps/http-api/objects/chat-channels/chat-channel-member.object.ts`
- Paginated: `src/apps/http-api/objects/chat-channels/paginated-chat-channel-members.object.ts`
- Resolver: `getChatChannelMembers` in `src/apps/http-api/resolvers/chat-channel/chat-channel.resolver.ts`

### Checklist

- Args class with `@ValidateIf` for identifiers, extends `PaginationArgs`
- Item GraphQL object with `fromEntity` static factory
- Paginated wrapper object with `data` + `total`
- Model `findMany` updated with `skip`, `take`, `orderBy`
- Types file extended with pagination fields
- Service chain delegates added
- Resolver query with parallel fetch + profile hydration
- `schema.gql` updated (types, query, enums)
- New enums registered in `http-api-enums.types.ts`
- `yarn code:full-lint` passes
