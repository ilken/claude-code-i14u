# Testing Standards

## Test Types Overview

| Type | Location | Init Method | Dependencies |
|------|----------|-------------|--------------|
| Unit | `src/**/__test__/*.spec.ts` | `new ClassName(mocks)` | All mocked |
| Service (Integration) | `test/e2e/{domain}/*.service.spec.ts` | `TestingApp.initModule()` | Real |
| E2E | `test/e2e/{domain}/*.e2e.spec.ts` | `TestingApp.initHttpApi()` | Real |

## Running Tests

```bash
yarn test:local -- {TEST_FILE_PATH}
```

Only one `test:local` process can run at a time. Redis is shared across runs, so concurrent executions will interfere with each other.

## Common Testing Tools

Referenced from `/test` folder:
- `/test/jest` -- Jest configuration and utilities
- `/test/msw` -- Mock Service Worker for HTTP mocking
- `/test/stubs` -- Test data and DTO builders

Always check existence in stubs folder before creating new ones.

---

## Unit Tests

### Isolation Requirements

- MUST be completely isolated and self-contained
- MUST mock all class dependencies using `mockDeep<T>()`
- MUST NOT use `test.app.jest.ts` for initialization
- MUST NOT use NestJS TestingModule
- MUST NOT depend on external services or databases

### Mock Setup Pattern

```typescript
import { mockDeep } from 'jest-mock-extended';

// CORRECT - Use mockDeep and classic service construction
const mockDependency = mockDeep<DependencyService>();
const service = new MyService(mockDependency, otherMockDependency);

// INCORRECT - NestJS TestingModule approach (FORBIDDEN in unit tests)
const module: TestingModule = await Test.createTestingModule({
  providers: [
    MyService,
    { provide: DependencyService, useValue: mockDependency },
  ],
}).compile();
```

### Mandatory File Structure

Every unit test file MUST follow this structure:

```typescript
import { mockDeep } from 'jest-mock-extended';
import { MyService } from './my.service';
import { DependencyService } from './dependency.service';

// ===== MOCK SETUP (REQUIRED) =====
const mockDependency = mockDeep<DependencyService>();
const mockOtherDependency = mockDeep<OtherDependencyService>();

// ===== SERVICE INSTANTIATION (REQUIRED) =====
const service = new MyService(mockDependency, mockOtherDependency);

// ===== TEST SETUP (REQUIRED) =====
beforeAll(() => {
  jest.resetAllMocks();
});

// ===== TEST CASES =====
describe('MyService', () => {
  describe('methodName', () => {
    it('should do something specific', async () => {
      // Prepare
      const input = 'test input';
      const expectedOutput = 'expected result';
      mockDependency.someMethod.mockResolvedValue(expectedOutput);

      // Execute
      const result = await service.methodName(input);

      // Validate
      expect(result).toBe(expectedOutput);
      expect(mockDependency.someMethod).toHaveBeenCalledWith(input);
    });

    it('should handle errors', async () => {
      // Prepare
      mockDependency.someMethod.mockRejectedValue(new Error('Test error'));

      // Execute & Validate
      await expect(service.methodName('input')).rejects.toThrow('Test error');
    });
  });
});
```

### Key Rules

- Declare all mocks using `mockDeep<T>()` at the top level
- Instantiate service using `new ClassName(mockDependencies)` at the top level
- Include `beforeAll(() => jest.resetAllMocks())`
- MUST NOT recreate mocks or service instances in each test
- Follow prepare-execute-validate pattern with clear comments
- Use proper types instead of `any`
- Avoid type casting -- ensure mock properties match expected types
- Use existing stub builders when available

### Common Patterns

**Retry Logic Testing:**

```typescript
it('should retry on failure', async () => {
  // Prepare
  mockService.method
    .mockRejectedValueOnce(new Error('First failure'))
    .mockResolvedValueOnce('success');

  // Execute
  const result = await service.methodWithRetry();

  // Validate
  expect(result).toBe('success');
  expect(mockService.method).toHaveBeenCalledTimes(2);
});
```

**Complex Object Mocking:**

```typescript
it('should handle complex objects', async () => {
  // Prepare - use existing stub builders when available
  const mockComplexObject = buildMyServiceResponseStub({
    id: 1,
    name: 'Test',
  });
  mockService.method.mockResolvedValue(mockComplexObject);

  // Execute
  const result = await service.method();

  // Validate
  expect(result).toEqual(mockComplexObject);
});
```

---

## Service (Integration) Tests

### Module Initialization

Must initialize a domain module using `TestingApp.initModule`:

```typescript
beforeAll(async () => {
  await TestingApp.initModule({
    imports: [MyModule],
  });
});

beforeEach(async () => {
  await TestingApp.reset();
});

afterAll(async () => {
  await TestingApp.tearDown();
});
```

### Key Rules

- Must test a single service
- Must test the interaction between the service and its dependencies
- May use real implementations of some dependencies
- Must follow prepare-execute-validate pattern
- Must reset test data between tests
- Located in `test/e2e/{domain}/{service-name}.service.spec.ts`

### Example

```typescript
beforeAll(async () => {
  await TestingApp.initModule({
    imports: [MyModule],
  });
});

beforeEach(async () => {
  await TestingApp.reset();
});

afterAll(async () => {
  await TestingApp.tearDown();
});

describe('MyService Integration', () => {
  it('should integrate with dependencies', async () => {
    // Prepare test data
    // Execute service method
    // Validate results
  });
});
```

---

## End-to-End (E2E) Tests

### Application Initialization

Must initialize using `TestingApp.initHttpApi()`. Must not import domain modules or providers directly.

### Key Rules

- Must test the entire application flow
- Must use real implementations of all dependencies
- Must have one test case per scenario
- Must not make multiple API calls in a single test case
- Must create all necessary test data before making the API call
- Must verify both positive and negative cases in the same test when testing filters
- Must use descriptive variable names (e.g., `inRangeUser`, `tooYoungUser`)
- Event tests must be in `test/e2e/event-listener` folder

### GraphQL API Tests

```typescript
const response = await TestingApp.graphql().send({
  query: `
    query HomePage($ageMin: Int, $ageMax: Int) {
      someQueryName(ageMin: $ageMin, ageMax: $ageMax) {
        field1
        field2
      }
    }
  `,
  variables: {
    ageMin: 25,
    ageMax: 35,
  },
});
```

### REST API Tests

```typescript
await TestingApp.http({
  get: '/api/endpoint',
})
  .expect(200)
  .expect((res) => {
    // assertions
  });
```

### Example E2E Test

```typescript
describe('Filtering', () => {
  it('should return only items within range', async () => {
    // Create test data
    const inRangeItem = await createItem({ value: 30 });
    const tooLowItem = await createItem({ value: 10 }); // Outside range
    const tooHighItem = await createItem({ value: 50 }); // Outside range

    // Make single API call
    await TestingApp.graphql()
      .send({
        query: `query FilterItems($min: Int, $max: Int) {
          items(min: $min, max: $max) {
            id
            value
          }
        }`,
        variables: {
          min: 20,
          max: 40,
        },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items).toHaveLength(1);
        expect(res.body.data.items[0].id).toEqual(inRangeItem.id);
      });
  });
});
```

---

## Push Notification Testing

### Mock Firebase Messaging

```typescript
const mockMessaging = mockDeep<Messaging>();
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(() => mockMessaging),
}));
```

### Device Token Setup

- Create device tokens for test profiles using `addUserDeviceTokenProfile()`
- Ensure profiles have valid device tokens before testing notifications
- Use existing profile stubs from `test/stubs/entities/profile.jest.ts`

### Test Pattern

```typescript
describe('Push Notification Feature', () => {
  it('should send notification to correct user', async () => {
    // 1. Create test profiles
    const [sender, receiver] = await Promise.all([
      createCollector(),
      createCollector(),
    ]);

    // 2. Setup device tokens
    await addUserDeviceTokenProfile(receiver);

    // 3. Create test data
    const testData = await createTestScenario();

    // 4. Execute notification logic
    await notificationService.sendNotification(testData);

    // 5. Verify notification was sent
    expect(mockMessaging.send).toHaveBeenCalledTimes(1);
    expect(mockMessaging.send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        data: {
          profileId: receiver.id.toString(),
        },
        notification: {
          title: expectedTitle,
          body: expectedBody,
          image: expectedImage,
        },
      }),
    );

    // 6. Verify database state
    const updatedRecord = await TestingApp.db.table.findUnique({
      where: { id: testData.id },
    });
    expect(updatedRecord?.notifiedAt).not.toBeNull();
  });
});
```

### Key Rules

- Always mock Firebase messaging service
- Create complete test data before testing
- Verify both positive and negative scenarios
- Check notification content and targeting accuracy
- Validate database state changes
