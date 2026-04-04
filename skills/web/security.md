# Security

Security checklist and patterns for the web project.

---

## XSS Prevention

- Never use `dangerouslySetInnerHTML` with unsanitized user input
- If HTML rendering is required, use a sanitizer like `DOMPurify`:
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
  ```
- All user input rendered in JSX is auto-escaped by React -- do not bypass this

## CSRF

- Validate CSRF tokens on API route POST/PUT/DELETE handlers
- Use `SameSite` cookie attributes

## Authentication and Authorization

- Protect routes and API routes with authentication guards
- Verify session/token on every protected API route:
  ```typescript
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ```
- Never trust client-side auth state alone

## Input Validation

- Use Zod schemas for runtime validation on all API route handlers
- Validate on the server side -- client validation is for UX only
- Validate and sanitize all user-facing inputs

## Server/Client Boundaries

- No secrets, API keys, or credentials in client bundles
- Check `"use client"` boundaries -- sensitive data must not leak to client components
- Use environment variables with `NEXT_PUBLIC_` prefix only for truly public values
- Never hardcode secrets or credentials

## Headers and Configuration

- Configure Content Security Policy (CSP) headers
- Set proper CORS configuration -- do not use wildcard `*` in production
- Validate redirect URLs to prevent open redirects

## Checklist

- [ ] No `dangerouslySetInnerHTML` with unsanitized input
- [ ] No secrets in client bundles or `"use client"` components
- [ ] API routes have authentication guards
- [ ] API routes validate input with Zod schemas
- [ ] CORS and CSP headers configured
- [ ] No open redirects (unvalidated redirect URLs)
- [ ] Error boundaries present for client-side error handling
