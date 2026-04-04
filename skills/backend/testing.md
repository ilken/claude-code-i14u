# Testing Standards (NestJS + Jest)

---

## Test Types

| Type | Location | Dependencies |
|------|----------|-------------|
| Unit | `src/**/*.spec.ts` | All mocked |
| Integration | `test/integration/**/*.spec.ts` | Real NestJS module, mocked external |
| E2E | `test/e2e/**/*.spec.ts` | Full app, real DB |

---

## Unit Tests

Mock ALL dependencies. Instantiate directly with `new` — no NestJS container. This makes tests fast and explicit about what they're testing.

```typescript
import { mockDeep } from 'jest-mock-extended';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

// ===== MOCKS =====
const prisma = mockDeep<PrismaService>();

// ===== SERVICE =====
const service = new UserService(prisma);

// ===== SETUP =====
beforeEach(() => jest.resetAllMocks());

// ===== TESTS =====
describe('UserService', () => {
  describe('findById', () => {
    it('returns the user when found', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 1, email: 'a@b.com' } as any);

      const result = await service.findById(1);

      expect(result.id).toBe(1);
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('propagates Prisma not-found error', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));
      await expect(service.findById(99)).rejects.toThrow('Not found');
    });
  });
});
```

**Rules:**
- `mockDeep<T>()` at top level — one instance reused across all tests
- Instantiate service once at top level
- `beforeEach(() => jest.resetAllMocks())` — prevents test-order dependencies
- Follow **Arrange → Act → Assert**

---

## Integration Tests (TestingModule)

Use when you need real NestJS DI but want to control external services.

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('UserService (integration)', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule, PrismaModule],
    }).compile();

    service = module.get(UserService);
    prisma = module.get(PrismaService);
  });

  afterAll(() => prisma.$disconnect());

  beforeEach(() => prisma.user.deleteMany()); // clean slate

  it('creates and retrieves a user', async () => {
    const created = await service.create({ email: 'test@test.com', name: 'Test' });
    const found = await service.findById(created.id);
    expect(found.email).toBe('test@test.com');
  });
});
```

---

## GraphQL Resolver Tests

Test resolvers via the full HTTP API with `supertest`. This validates the whole stack: args validation → resolver → service → response shape.

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserResolver (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('getUser returns user by id', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query GetUser($id: Int!) {
            user(id: $id) { id email }
          }
        `,
        variables: { id: 1 },
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.user).toMatchObject({ id: 1 });
  });

  it('getUser returns null for unknown id', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `query { user(id: 9999) { id } }`,
      })
      .expect(200);

    expect(res.body.data.user).toBeNull();
  });

  it('createUser validates email format', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { createUser(input: { email: "not-an-email", name: "X" }) { id } }`,
      })
      .expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/email/i);
  });
});
```

---

## REST API E2E Tests

```typescript
it('GET /users/:id', async () => {
  const res = await request(app.getHttpServer())
    .get('/users/1')
    .expect(200);

  expect(res.body).toMatchObject({ id: 1, email: expect.any(String) });
});

it('POST /users validates body', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({ email: 'invalid' }) // missing name, bad email
    .expect(400);
});
```

---

## Common Patterns

**Retry logic:**
```typescript
mockService.method
  .mockRejectedValueOnce(new Error('Transient failure'))
  .mockResolvedValueOnce('success');
```

**Prisma unique violation in unit test:**
```typescript
import { Prisma } from '@prisma/client';

prisma.user.create.mockRejectedValue(
  new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: '5.0.0',
    meta: { target: ['email'] },
  }),
);

await expect(service.create({ email: 'dup@test.com' })).rejects.toThrow(ConflictException);
```

---

## Key Rules

1. **Unit tests: no DI container, no DB** — instantiate directly with mocks
2. **Integration tests: real module, clean DB state** — `beforeEach` cleanup
3. **GraphQL e2e: test through HTTP** — validates args, error shape, and schema together
4. **One assertion concept per `it`** — keep tests focused
5. **Descriptive names** — `'should return 404 when user not found'` not `'test error'`
6. **`toMatchObject` over `toEqual`** — more resilient to schema additions
