# GraphQL Patterns (NestJS + Apollo)

Generic patterns for NestJS code-first GraphQL.

---

## Enum Registration

Prisma enums used as `@Field()` types must be registered with `registerEnumType` — otherwise they won't appear in `schema.gql` and queries fail silently at runtime.

```typescript
import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of a user in the system',
});
```

Register all enums in one place (e.g., `src/common/graphql-enums.ts`) and import it in `AppModule` so they're registered before the schema is generated.

---

## At-Least-One-Required Field Validation

When two fields are mutually optional but at least one is required, enforce this at class-validator level — never with manual if-checks in the resolver. Manual checks leak validation logic out of the DTO layer.

```typescript
// ✅ Validation in the DTO
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

// Resolver — no manual check needed
public async getResource(@Args() args: GetResourceArgs) {
  const entity = args.resourceId
    ? await this.service.findById(args.resourceId)
    : await this.service.findByExternalId(args.externalId!);
}
```

```typescript
// ❌ Manual check in resolver — wrong layer
public async getResource(@Args() args: GetResourceArgs) {
  if (!args.resourceId && !args.externalId) throw new Error('...');
}

// ❌ @IsOptional defeats the @ValidateIf guard
@ValidateIf((o) => o.resourceId == undefined)
@IsString()
@IsOptional() // ← allows both to be undefined
declare externalId?: string;
```

---

## Paginated Query Pattern

Standard `data + total` shape. Always fetch count in parallel with data — sequential fetches add unnecessary latency.

```typescript
// Args
@ArgsType()
export class GetItemsArgs {
  @Field(() => Int, { nullable: true })
  @IsOptional() @IsInt() @Min(0)
  declare skip?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  declare take?: number;
}

// Object types
@ObjectType()
export class ItemObject {
  @Field(() => Int) id: number;
  @Field() name: string;

  static fromEntity(e: Item): ItemObject {
    const o = new ItemObject();
    o.id = e.id; o.name = e.name;
    return o;
  }
}

@ObjectType()
export class PaginatedItemsObject {
  @Field(() => [ItemObject]) data: ItemObject[];
  @Field(() => Int) total: number;
}

// Resolver
@Query(() => PaginatedItemsObject)
async getItems(@Args() args: GetItemsArgs): Promise<PaginatedItemsObject> {
  const [items, total] = await Promise.all([
    this.service.findMany({ skip: args.skip, take: args.take }),
    this.service.count(),
  ]);
  return { data: items.map(ItemObject.fromEntity), total };
}
```

---

## N+1 Problem — DataLoader

Field resolvers that fetch related data create N+1 queries by default. Use DataLoader to batch them into a single query per request.

```typescript
// Without DataLoader: 1 query for posts + N queries for each author
@ResolveField(() => UserObject)
async author(@Parent() post: PostObject): Promise<UserObject> {
  return this.userService.findById(post.authorId); // called N times
}

// With DataLoader: 1 query for posts + 1 batched query for all authors
@Injectable({ scope: Scope.REQUEST })
export class UserLoader {
  private loader = new DataLoader<number, User>(async (ids) => {
    const users = await this.userService.findManyByIds([...ids]);
    const map = new Map(users.map(u => [u.id, u]));
    return ids.map(id => map.get(id) ?? new Error(`User ${id} not found`));
  });

  constructor(private readonly userService: UserService) {}

  load(id: number) { return this.loader.load(id); }
}

// In resolver
@ResolveField(() => UserObject)
async author(@Parent() post: PostObject): Promise<UserObject> {
  return this.userLoader.load(post.authorId); // batched automatically
}
```

DataLoader must be `REQUEST` scoped so the batch cache doesn't persist across requests.

---

## Error Handling in Resolvers

Throw NestJS HTTP exceptions — Apollo maps them to GraphQL errors automatically.

```typescript
@Query(() => ItemObject, { nullable: true })
async getItem(@Args('id', { type: () => Int }) id: number): Promise<ItemObject> {
  const item = await this.service.findById(id);
  if (!item) throw new NotFoundException(`Item ${id} not found`);
  return ItemObject.fromEntity(item);
}

@Mutation(() => ItemObject)
async createItem(@Args('input') input: CreateItemInput): Promise<ItemObject> {
  try {
    const item = await this.service.create(input);
    return ItemObject.fromEntity(item);
  } catch (error) {
    if (error instanceof ConflictError) throw new ConflictException(error.message);
    throw error;
  }
}
```

---

## Resolver Structure

```typescript
@Resolver(() => UserObject)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly postLoader: PostLoader, // DataLoader for related data
  ) {}

  @Query(() => UserObject, { nullable: true })
  async getUser(@Args('id', { type: () => Int }) id: number) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException();
    return UserObject.fromEntity(user);
  }

  @Mutation(() => UserObject)
  async createUser(@Args('input') input: CreateUserInput) {
    return UserObject.fromEntity(await this.userService.create(input));
  }

  @ResolveField(() => [PostObject])
  async posts(@Parent() user: UserObject) {
    return this.postLoader.loadForUser(user.id); // batched
  }
}
```

---

## Anti-Patterns

- **Manual validation in resolvers** — use class-validator decorators in Args/Input
- **Business logic in resolvers** — delegate to services
- **Returning Prisma models directly** — always map to `@ObjectType()` classes
- **Field resolvers without DataLoader** — always batch related entity lookups
- **Sequential `Promise` calls** — use `Promise.all` for parallel fetches
