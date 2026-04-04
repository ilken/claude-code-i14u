# Testing (Next.js + Playwright + RTL)

Test structure, tools, and patterns for Next.js web projects.

---

## Test Types and Locations

| Type            | Location                                         | Tools                        |
| --------------- | ------------------------------------------------ | ---------------------------- |
| Unit tests      | `src/{module}/__tests__/{file}.test.ts`          | Vitest / Jest                |
| Component tests | `src/components/__tests__/{component}.test.tsx`  | RTL, userEvent               |
| Hook tests      | `src/hooks/__tests__/{hook}.test.ts`             | renderHook, RTL              |
| API route tests | `src/app/api/__tests__/{route}.test.ts`          | Vitest / Jest                |
| E2E tests       | `e2e/{flow}.spec.ts`                             | Playwright                   |

## Running Tests

```bash
npm test -- {TEST_FILE_PATH}    # unit/component
npx playwright test             # E2E
npx playwright test --ui        # Playwright UI mode (visual, great for debugging)
```

Run in a loop — fix failures until all pass.

---

## Unit Tests

```typescript
import { formatDate } from '@/lib/format-date';

describe('formatDate', () => {
  it('formats ISO string to readable date', () => {
    expect(formatDate('2024-01-15T00:00:00Z')).toBe('Jan 15, 2024');
  });

  it('returns empty string for null input', () => {
    expect(formatDate(null)).toBe('');
  });
});
```

One test file per source file. Mock external dependencies. Follow arrange → act → assert.

---

## Component Tests

Test behavior, not implementation. Query by role and text — never by class or ID. That keeps tests resilient to markup changes.

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileForm } from '@/components/features/user/ProfileForm';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe('ProfileForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ProfileForm onSubmit={onSubmit} />, { wrapper });

    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    render(<ProfileForm onSubmit={vi.fn()} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });
});
```

Mock GraphQL responses with MSW. Test: rendering, interactions, loading states, error states, accessibility.

---

## Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useUser', () => {
  it('returns user data on success', async () => {
    // mock apiClient.request here via vi.mock or MSW
    const { result } = renderHook(() => useUser('1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.name).toBe('Alice');
  });
});
```

---

## Playwright E2E Setup (Next.js App Router)

### Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

The `webServer` block starts `next dev` automatically when running Playwright, so you don't need to run it separately.

### Page Object Pattern

Encapsulate selectors in Page Objects so tests read like user stories, not CSS selectors:

```typescript
// e2e/pages/login.page.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }

  async expectError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test('logs in with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});

test('shows error for wrong password', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'wrong');
  await loginPage.expectError('Invalid credentials');
});
```

### Testing Server Components and Route Handlers

Server Components render HTML on the server — test them through the HTTP response, not by importing them directly:

```typescript
test('dashboard page renders user name from server', async ({ page }) => {
  // Authenticate first (set cookie, localStorage, etc.)
  await page.context().addCookies([{ name: 'session', value: 'test-token', url: 'http://localhost:3000' }]);

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
});
```

For API Route Handlers, use Playwright's `request` context:

```typescript
test('GET /api/users returns 401 when not authenticated', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(401);
});

test('POST /api/users creates user', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { email: 'new@example.com', name: 'New User' },
    headers: { Authorization: 'Bearer test-token' },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.email).toBe('new@example.com');
});
```

---

## API Route / Integration Tests

```typescript
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/route';

describe('GET /api/users', () => {
  it('returns 401 when unauthenticated', async () => {
    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
```

Test: request/response cycle, authentication, input validation, error responses.
