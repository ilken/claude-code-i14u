# Queue Processing (BullMQ + NestJS)

Generic BullMQ patterns for NestJS backends.

---

## Setup

Use config-validated Redis connection — never read `process.env` directly in modules.

```bash
npm install @nestjs/bullmq bullmq
```

```typescript
// app.module.ts
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

---

## Step 1: Define Queue Constants

```typescript
// my-domain/my-domain.constants.ts
export const MY_DOMAIN_QUEUE = 'my-domain-queue';

export enum MyDomainQueueJobs {
  ProcessSomething = 'process-something',
  SendNotification = 'send-notification',
}
```

---

## Step 2: Register Queue in Domain Module

```typescript
// my-domain/my-domain.module.ts
@Module({
  imports: [
    BullModule.registerQueue({ name: MY_DOMAIN_QUEUE }),
  ],
  providers: [MyDomainService],
  exports: [MyDomainService],
})
export class MyDomainModule {}
```

---

## Step 3: Add Jobs from a Service

```typescript
// my-domain/my-domain.service.ts
@Injectable()
export class MyDomainService {
  constructor(
    @InjectQueue(MY_DOMAIN_QUEUE)
    private readonly queue: Queue,
  ) {}

  async queueProcessSomethingJob(data: MyJobData): Promise<void> {
    await this.queue.add(MyDomainQueueJobs.ProcessSomething, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100, // keep last 100 failed jobs for debugging
    });
  }
}
```

---

## Step 4: Create a Processor

Keep processors thin — delegate real work to services. The processor's job is routing and error observability, not business logic.

```typescript
// my-domain/my-domain.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor(MY_DOMAIN_QUEUE)
export class MyDomainProcessor extends WorkerHost {
  private readonly logger = new Logger(MyDomainProcessor.name);

  constructor(private readonly myService: MyDomainService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing job ${job.id} (${job.name})`);

    switch (job.name) {
      case MyDomainQueueJobs.ProcessSomething:
        await this.myService.doSomething(job.data);
        break;

      case MyDomainQueueJobs.SendNotification:
        await this.myService.sendNotification(job.data);
        break;

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }

    this.logger.log(`Completed job ${job.id} (${job.name})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts`,
      error.stack,
    );
  }
}
```

---

## Step 5: Register Processor in a Queue Consumer Module

Keep all processors in a dedicated module so the domain modules stay clean and the consumer module can be imported once in `AppModule`:

```typescript
// queue-consumer/queue-consumer.module.ts
@Module({
  imports: [MyDomainModule],
  providers: [MyDomainProcessor],
})
export class QueueConsumerModule {}
```

---

## Idempotency — Design Jobs to be Safe to Retry

BullMQ retries jobs on failure. If your job sends an email, charges a card, or inserts a record, running it twice causes duplicates. Design every job handler to be idempotent:

- **Check before acting**: `if (await this.emailService.alreadySent(jobId)) return;`
- **Use upsert over insert**: `prisma.record.upsert({ where: { jobId } })` instead of `create`
- **Use `jobId` for deduplication**: BullMQ won't add a second job with the same ID if the first is still in the queue

```typescript
// Deduplicate: only one job per user per type in the queue at a time
await this.queue.add(MyDomainQueueJobs.SendNotification, data, {
  jobId: `notification-${data.userId}`, // stable, deterministic ID
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});
```

---

## Job Options Reference

```typescript
await this.queue.add(jobName, data, {
  attempts: 3,                              // Retry up to 3 times
  backoff: {
    type: 'exponential',                    // 'exponential' | 'fixed'
    delay: 5000,                            // 5s base delay
  },
  delay: 10000,                             // Delay first execution by 10s
  priority: 1,                              // Lower number = higher priority
  removeOnComplete: true,                   // Clean up on success
  removeOnFail: 100,                        // Keep last 100 failed for debugging
  jobId: `unique-${data.id}`,              // Deduplicate by job ID
});
```

---

## Scheduled / Repeatable Jobs

```typescript
// Register a repeating job (cron-like)
await this.queue.add(
  'daily-summary',
  {},
  {
    repeat: {
      pattern: '0 9 * * *', // Every day at 9am
      tz: 'UTC',
    },
  },
);
```

---

## Monitoring with BullBoard

BullBoard gives you a visual dashboard for inspecting queues, retrying failed jobs, and monitoring throughput — invaluable in production.

```bash
npm install @bull-board/nestjs @bull-board/api @bull-board/express
```

```typescript
// app.module.ts
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: MY_DOMAIN_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
})
export class AppModule {}
```

Protect the `/queues` route with an admin auth guard in production.

---

## Key Rules

1. **One queue per domain** — don't share queues across unrelated modules
2. **Keep processors thin** — delegate to services for business logic
3. **Always log on failure** — use `@OnWorkerEvent('failed')`
4. **Idempotent jobs** — jobs will be retried; design every handler to be safe to run twice
5. **Use `jobId` for deduplication** — prevents duplicate processing for the same entity
6. **Use `forRootAsync`** — connect via `ConfigService`, not raw `process.env`
