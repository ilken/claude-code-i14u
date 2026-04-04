# Queue Processing

## Overview

All queue processors must produce consistent, queryable metrics and logs. The `AbstractQueueProcessor` base class (`src/apps/queue-consumer/abstract-queue.processor.ts`) extends `WorkerHost` from `@nestjs/bullmq` and centralises:

- **Consistent log flow** -- debug "Started processing job", log "Processed job"
- **`timeOnQueueMs` metric** -- processing-time delta relative to job creation
- **Unified error handling** via `handleError` (`@OnWorkerEvent('failed')`) -- `EqualsNotFoundError` detection, max-attempts logging
- **Serialised log context** -- every log entry includes job id, name, data, attempts, and timestamps

## How to Use

### Step 1: Define Queue Constants

```typescript
// src/my-domain/my-domain.constants.ts
export const MyDomainQueue = 'my-domain-queue';

export enum MyDomainQueueJobs {
  ProcessSomething = 'process-something',
}
```

### Step 2: Register the Queue in your Domain Module

```typescript
// src/my-domain/my-domain.module.ts
import { Module } from '@nestjs/common';
import { BullConnections } from 'global/bull/bull.types';
import { EqualsBullModule } from 'global/bull/equals-bull.module';
import { MyDomainQueue } from 'my-domain/my-domain.constants';
import { MyDomainService } from 'my-domain/my-domain.service';

@Module({
  imports: [
    EqualsBullModule.registerQueue({
      connection: BullConnections.General,
      name: MyDomainQueue,
    }),
  ],
  providers: [MyDomainService],
  exports: [MyDomainService],
})
export class MyDomainModule {}
```

### Step 3: Add Jobs to the Queue

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MyDomainQueue, MyDomainQueueJobs } from 'my-domain/my-domain.constants';
import { MyJobData } from 'my-domain/my-domain.types';

@Injectable()
export class MyDomainService {
  constructor(
    @InjectQueue(MyDomainQueue)
    private readonly queue: Queue,
  ) {}

  public async queueProcessSomethingJob(data: MyJobData): Promise<void> {
    await this.queue.add(MyDomainQueueJobs.ProcessSomething, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
```

### Step 4: Extend AbstractQueueProcessor

Create processor in `src/apps/queue-consumer/`.

**Simple single-job processor:**

```typescript
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AbstractQueueProcessor } from 'apps/queue-consumer/abstract-queue.processor';
import { DEFAULT_WORKER_OPTIONS } from 'global/bull/bull.types';
import { MyDomainQueue } from 'my-domain/my-domain.constants';
import { MyJobData } from 'my-domain/my-domain.types';
import { MyDomainService } from 'my-domain/my-domain.service';

@Processor(MyDomainQueue, DEFAULT_WORKER_OPTIONS)
export class MyDomainQueueProcessor extends AbstractQueueProcessor<MyJobData> {
  constructor(private readonly myService: MyDomainService) {
    super();
  }

  public async process(job: Job<MyJobData>): Promise<void> {
    await this.processWithLogging(job, async (data) => {
      await this.myService.doSomething(data);
    });
  }
}
```

**Multi-job processor (single queue, multiple job names):**

```typescript
@Processor(MyDomainQueue, DEFAULT_WORKER_OPTIONS)
export class MyDomainQueueProcessor extends AbstractQueueProcessor<JobAData | JobBData> {
  constructor(private readonly myService: MyDomainService) {
    super();
  }

  public async process(job: Job<JobAData | JobBData>): Promise<void> {
    switch (job.name) {
      case MyDomainQueueJobs.JobA:
        await this.processWithLogging(job, async (data) => {
          await this.myService.handleJobA(data as JobAData);
        });
        break;

      case MyDomainQueueJobs.JobB:
        await this.processWithLogging(job, async (data) => {
          await this.myService.handleJobB(data as JobBData);
        });
        break;

      default:
        this.logger.error(`Unknown job name on MyDomainQueueProcessor`, {
          job: QueueJobUtils.getJobDataForLogging(job),
        });
    }
  }
}
```

**Processor with custom worker options (e.g. rate limiting):**

```typescript
@Processor(MyDomainQueue, {
  ...DEFAULT_WORKER_OPTIONS,
  limiter: { max: 1000, duration: 60000 },
})
export class MyDomainQueueProcessor extends AbstractQueueProcessor<MyJobData> {
  // ...
}
```

### Step 5: Register the Processor

Add the processor to `src/apps/queue-consumer/queue.consumer.module.ts`:

```typescript
@Module({
  imports: [
    // ... existing imports
    MyDomainModule,
  ],
  providers: [
    // ... existing providers
    MyDomainQueueProcessor,
  ],
})
export class QueueConsumerModule {}
```

## Key Rules

1. **Override `process` from `WorkerHost`** -- Declare as `process(job: Job<T>): Promise<void>` with the concrete job data type
2. **Call `this.processWithLogging()`** -- Pass the job and a callback containing only business logic
3. **Do NOT add `@OnWorkerEvent('failed')`** -- The abstract class already registers `handleError`. Adding another creates duplicate handlers
4. **Do NOT add try/catch** -- `processWithLogging` lets errors propagate to `handleError` automatically
5. **Use `DEFAULT_WORKER_OPTIONS`** -- Import from `global/bull/bull.types`. Override individual options via spread when needed
6. **`@Processor` replaces both `@Processor` and `@Process`** -- In `@nestjs/bullmq`, there is no `@Process` decorator. The `process` method is inherited from `WorkerHost`

## Metrics You Get Automatically

1. **Consistent log shape** -- every processor emits the same structured fields
2. **`timeOnQueueMs`** -- time delta between job creation and processing start
3. **`processingTime`** -- time delta between processing start and finish
4. **`totalTime`** -- total time from job creation to completion
5. **`EqualsNotFoundError` handling** -- logged as `warn`, does not trigger max-attempts error logging
6. **Max Attempts Logging** -- `error` when `job.attemptsMade >= jobMaxAttempts`
7. **`onMaxAttempts` hook** -- override in your processor for custom behaviour (e.g. Slack alerts) when a job exhausts all retries
8. **Logger initialization** -- the abstract class creates the `Logger` instance; no need to declare one

## Notes

- The callback passed to `this.processWithLogging()` should contain only business logic
- Never add custom logging for job start/success/failure
- Queue consumers must be App Modules in `src/apps/queue-consumer/`
- Queues must be registered in domain modules using `EqualsBullModule.registerQueue()`
- Queue names must be prefixed with the domain name
- Job data classes live in `src/<domain>/job/` or `src/<domain>/jobs/`
