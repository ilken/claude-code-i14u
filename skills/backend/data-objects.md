# Data Object Writing Style

## Entity & DTO Writing Style

Applies to both Entity (`.entity.ts`) and DTO (`.dto.ts`) files in `src/` modules, excluding `src/apps/`.

### Props Must Use Primitive Types Only

Do NOT use Prisma model types or namespace types in data object Props. Define Props with primitive types only.

Prisma enums ARE allowed (e.g., `Currency`, `ChatChannelType`, `MembershipTier`).

```typescript
// BAD - using Prisma model types directly
import { Item } from '@prisma/client';
type Props = Item;

// BAD - Pick/Omit from Prisma model types
type Props = Pick<Item, 'id' | 'name'>;

// BAD - using Prisma namespace types
import { Prisma } from '@prisma/client';
type Props = {
  details: Prisma.InputJsonValue;
};

// GOOD - explicit primitive types
type Props = {
  id: number;
  name: string;
  providerId: string | null;
};

// GOOD - Prisma enums are allowed
import { Currency, ChatChannelType } from '@prisma/client';
type Props = {
  currency: Currency;
  type: ChatChannelType;
};
```

### Nested Object Types

Use inline object types with primitives for nested structures:

```typescript
type Props = {
  id: number;
  jurisdiction: {
    code: string;
    price: number;
    currency: Currency; // Prisma enum is OK
  };
  variants: {
    id: number;
    url: string | null;
  }[];
};
```

### Explicit Property Assignment

Data object constructors must explicitly assign each property:

```typescript
// BAD - avoid Object.assign in data objects
constructor(props: Props) {
  Object.assign(this, { ...props });
}

// GOOD - explicit assignments
public readonly id: number;
public readonly name: string;

constructor(props: Props) {
  this.id = props.id;
  this.name = props.name;
}
```

### Type Conversions in Model/Service Layer

Convert Prisma model types to primitives in the model/service layer, not in the data object:

```typescript
// In model.ts or service.ts
return new PayoutEntity({
  id: record.id,
  amount: record.amount.toNumber(), // Decimal -> number
  providerId: record.providerId,    // Already string | null
  metadata: record.metadata as { key: string } | null,
  currency: record.currency,        // Prisma enum - OK to pass directly
});
```

### Complete Entity Example

```typescript
type CityEntityProps = {
  id: number;
  name: string;
  countryName: string;
  countryISOCode: string;
};

export class CityEntity {
  public readonly id: number;
  public readonly name: string;
  public readonly countryName: string;
  public readonly countryISOCode: string;

  constructor(record: CityEntityProps) {
    this.id = record.id;
    this.name = record.name;
    this.countryName = record.countryName;
    this.countryISOCode = record.countryISOCode;
  }
}
```

### Complete DTO Example

```typescript
import { ChatChannelType } from '@prisma/client';

type SearchChatRoomProps = {
  chatRoomId: string;
  name: string;
  picture: string | null;
  type: ChatChannelType;
};

export class SearchChatRoomDto {
  public readonly chatRoomId: string;
  public readonly name: string;
  public readonly picture: string | null;
  public readonly type: ChatChannelType;

  constructor(props: SearchChatRoomProps) {
    this.chatRoomId = props.chatRoomId;
    this.name = props.name;
    this.picture = props.picture;
    this.type = props.type;
  }
}
```

## Framework Input Writing Style

Applies to framework-populated input types in `src/apps/http-api/`:
- **HTTP DTOs** (`.dto.ts`) -- Request body validation
- **GraphQL Inputs** (`.input.ts`) -- Mutation/query inputs
- **GraphQL Args** (`.args.ts`) -- Query arguments

These types are instantiated and populated by the framework (NestJS/class-transformer/GraphQL) at runtime, not by application code.

### Use `declare` Keyword for Properties

Use the `declare` keyword for all properties. This satisfies TypeScript `strictPropertyInitialization`, indicates the framework handles property assignment, and does not emit any JavaScript initialization code.

```typescript
// BAD - will fail with strict mode
@IsEmail()
email: string;

// GOOD - declare tells TypeScript the property will exist at runtime
@IsEmail()
declare email: string;
```

### HTTP DTO Pattern

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  declare email: string;

  @IsString()
  @MinLength(8)
  declare password: string;

  @IsOptional()
  @IsString()
  declare referrer?: string;
}
```

### GraphQL Input Pattern

```typescript
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @IsEmail()
  @Field(() => String)
  declare email: string;

  @IsString()
  @Field(() => String)
  declare code: string;
}
```

### GraphQL Args Pattern

```typescript
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  declare cursor?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  declare take?: number;
}
```

### Abstract Base Classes

Abstract base classes also use `declare`:

```typescript
@InputType({ isAbstract: true })
export class ProfileIdInput {
  @Field(() => Int)
  declare profileId: number;
}
```

### Optional Properties

Optional properties combine `declare` with `?`:

```typescript
@IsOptional()
@IsString()
declare referrer?: string;
```

### Inheritance with IntersectionType

When using `IntersectionType` or extending base inputs, child properties still use `declare`:

```typescript
@InputType()
export class PurchaseItemInput extends IntersectionType(
  CollectableItemIdInput,
  ProfileIdInput,
) {
  @Field(() => Int)
  declare creditAmount: number;

  @Field(() => String, { nullable: true })
  declare comment?: string;
}
```

### Exclusions -- Response/Output DTOs

Files with constructors are response/output types and should NOT use `declare`. These follow the entity writing style pattern instead (explicit assignment in constructor).

```typescript
export class CityLocationDto {
  public readonly key: string;
  public readonly name: string;

  constructor(key: string, name: string) {
    this.key = key;
    this.name = name;
  }
}
```
