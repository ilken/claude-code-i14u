# Configuration Management (NestJS + Zod)

Config is validated at startup with Zod so misconfigured deployments fail fast — before any requests are served. Each domain of config gets its own schema so errors pinpoint exactly which service is misconfigured.

---

## Setup

```typescript
// config/env.config.ts
import { z } from 'zod';

const AppSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const DatabaseSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const RedisSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
});

// Merge all domain schemas
export const configSchema = AppSchema.merge(DatabaseSchema).merge(RedisSchema);

export type ConfigType = z.infer<typeof configSchema>;

// Validation function passed to NestJS ConfigModule
export const validateEnv = (config: Record<string, unknown>): ConfigType => {
  const result = configSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation failed:\n${result.error.message}`);
  }
  return result.data;
};
```

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // no need to import ConfigModule in every module
      validate: validateEnv,
      cache: true,          // avoid re-parsing on every get()
    }),
  ],
})
export class AppModule {}
```

---

## Adding a New Config Domain

### 1. Add variables to `.env.example` and `.env`

```env
# Payment (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_TIMEOUT_MS=5000
```

### 2. Add schema in `config/env.config.ts`

```typescript
const StripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_TIMEOUT_MS: z.coerce.number().default(5000),
});

// Merge into the main schema
export const configSchema = AppSchema
  .merge(DatabaseSchema)
  .merge(RedisSchema)
  .merge(StripeSchema); // ← add here
```

### 3. Create a typed service wrapper (optional but recommended for large configs)

A wrapper avoids scattering `configService.get<string>('STRIPE_SECRET_KEY')` calls — it's easy to mistype string keys.

```typescript
// config/stripe.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from './env.config';

@Injectable()
export class StripeConfigService {
  constructor(private readonly config: ConfigService<ConfigType, true>) {}

  get secretKey(): string {
    return this.config.get('STRIPE_SECRET_KEY', { infer: true });
  }

  get webhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
  }

  get timeoutMs(): number {
    return this.config.get('STRIPE_TIMEOUT_MS', { infer: true });
  }
}
```

---

## Consuming Config in a Service

```typescript
// integrations/stripe/stripe.client.ts
@Injectable()
export class StripeClient {
  private readonly stripe: Stripe;

  constructor(private readonly stripeConfig: StripeConfigService) {
    this.stripe = new Stripe(stripeConfig.secretKey, {
      timeout: stripeConfig.timeoutMs,
    });
  }
}
```

Or inject `ConfigService` directly for simple cases:

```typescript
@Injectable()
export class SomeService {
  constructor(private readonly config: ConfigService<ConfigType, true>) {}

  doSomething() {
    const dbUrl = this.config.get('DATABASE_URL', { infer: true });
    // infer: true gives you proper TypeScript types from the schema
  }
}
```

---

## Rules

- **One schema per domain** — keeps validation errors readable ("Stripe config invalid" vs. a wall of errors)
- **Coerce numeric env vars** — env vars are always strings; `z.coerce.number()` handles the conversion
- **Always provide defaults for optional values** — required values should have no default, making missing config a startup error
- **Never read `process.env` directly** in services — always go through `ConfigService` so config is validated and typed
