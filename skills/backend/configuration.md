# Configuration Management

## Overview

Configuration settings use environment variables validated with Zod schemas. Each domain of knowledge has its own schema.

## Adding Configuration

### 1. Update Environment Files

Add new variables to `.env.example` and `.env`.

### 2. Add Schema in configuration.schema.ts

```typescript
export const ExampleDomainSchema = z.object({
  EXAMPLE_API_KEY: z.string(),
  EXAMPLE_SECRET: z.string(),
  EXAMPLE_TIMEOUT: z.string().transform(Number).default('30'),
});

export type ExampleDomainSchemaType = z.infer<typeof ExampleDomainSchema>;
```

### 3. Update ConfigurationType

```typescript
export type ConfigurationType = z.infer<typeof configSchema> & {
  example: ExampleDomainSchemaType;
  // other schemas...
};
```

### 4. Add Getter in configuration.service.ts

```typescript
export class ConfigurationService {
  get EXAMPLE_DOMAIN(): ExampleDomainSchemaType {
    return this.config.example;
  }
}
```

## Rules

- Must use schemas associated with a single domain of knowledge
- Must contain all domain knowledge under the same schema
- Must define properties as String and required by default
- Must check for existing properties before adding to avoid duplication
- Must maintain schema organization by domain
- Must ensure type safety through Zod validation
