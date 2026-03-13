---
name: Service access patterns
description: Always use parent module's public service (e.g. ProfileService) instead of importing internal sub-modules (e.g. ProfileFollowModule) directly
type: feedback
---

Never import internal sub-modules into other domain modules. Use the parent module's public service as the access layer.

**Why:** The backend uses a layered module architecture where each domain module exports a single public service. Importing internal sub-modules breaks encapsulation and creates tight coupling. User corrected this when I imported `ProfileFollowModule` into `ChatChannelModule` instead of using `ProfileService`.

**How to apply:** When you need functionality from another domain (e.g., follow checks, collected items), check if the parent service (e.g., `ProfileService`, `CollectableService`) already exposes a passthrough method. If not, add one rather than importing the sub-module directly.
