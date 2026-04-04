# Security (Next.js)

Security patterns for Next.js web projects.

---

## XSS Prevention

React auto-escapes JSX — don't bypass it. If you need to render user-supplied HTML, sanitize first:

```typescript
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

Never pass raw user input to `dangerouslySetInnerHTML`.

---

## CSRF

- Use `SameSite=Strict` or `SameSite=Lax` cookie attributes — this blocks cross-site requests from sending your cookie automatically
- Validate CSRF tokens on state-mutating API route handlers (POST/PUT/PATCH/DELETE) if you use session cookies
- Server Actions are CSRF-safe by default (Next.js validates the `Origin` header)

---

## Authentication and Authorization

### Middleware — global route protection

Middleware runs before every request — use it to redirect unauthenticated users globally instead of adding checks to every page:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/about'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isPublic = PUBLIC_ROUTES.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next.js internals and static files — without this, middleware runs on every asset
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Middleware alone is not enough.** It can be bypassed or misconfigured. Always also verify the session in API route handlers and Server Actions:

```typescript
// API route handler
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Server Action
const session = await getServerSession(authOptions);
if (!session) throw new Error('Unauthorized');
```

Never trust client-side auth state for anything security-sensitive.

---

## Input Validation

Use Zod for runtime validation on all API route handlers and Server Actions. Client-side validation is for UX only — the server is the boundary that matters.

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = CreateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await userService.create(parsed.data);
  return NextResponse.json(user, { status: 201 });
}
```

---

## Environment Variables and Secret Boundaries

Next.js exposes any variable prefixed with `NEXT_PUBLIC_` to the client bundle — treat these as public. Secrets must never have this prefix.

```bash
# .env.local
DATABASE_URL=...              # ✅ server-only, never in bundle
STRIPE_SECRET_KEY=...         # ✅ server-only
NEXTAUTH_SECRET=...           # ✅ server-only

NEXT_PUBLIC_API_URL=...       # ✅ intentionally public — API URL
NEXT_PUBLIC_STRIPE_PK=...     # ✅ intentionally public — Stripe publishable key
```

When a Server Component passes data to a Client Component via props, only pass what the client needs — don't spread the entire server-fetched object if it contains sensitive fields.

```typescript
// ❌ may leak sensitive fields to client bundle
<ClientComponent user={serverFetchedUser} />

// ✅ explicit, minimal
<ClientComponent name={serverFetchedUser.name} avatarUrl={serverFetchedUser.avatarUrl} />
```

---

## Headers and Configuration

Configure security headers in `next.config.js`:

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // tighten in prod
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "connect-src 'self' https://api.yourapp.com",
    ].join('; '),
  },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

- Do not use wildcard `*` for CORS in production
- Validate redirect URLs to prevent open redirects — check the destination is an allowed domain before redirecting

---

## Open Redirects

Never redirect to a URL from query params without validating the destination:

```typescript
// ❌ open redirect — attacker sends ?callbackUrl=https://evil.com
const callbackUrl = searchParams.get('callbackUrl');
redirect(callbackUrl);

// ✅ validate it's a relative path (starts with /)
const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
const safeUrl = callbackUrl.startsWith('/') ? callbackUrl : '/dashboard';
redirect(safeUrl);
```

---

## Checklist

- [ ] No `dangerouslySetInnerHTML` with unsanitized input
- [ ] No secrets in `NEXT_PUBLIC_` variables or `'use client'` components
- [ ] Middleware redirects unauthenticated users on protected routes
- [ ] API routes and Server Actions verify session independently (not just middleware)
- [ ] All API route inputs validated with Zod
- [ ] CORS restricted to known origins in production
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] No open redirects (callback URLs validated to be relative paths)
- [ ] Error boundaries present for client-side error handling
