# Domain Knowledge

## Investor Feed Posts

### Post vs Repost vs Quoted Repost

Posts use a self-relation (`originalPostId`) to represent reposts:

| Scenario | `originalPostId` | `text` |
|---|---|---|
| Original post | `null` | non-empty |
| Plain repost | set | `""` (empty) |
| Quoted repost | set | non-empty |

### Filtering Reposts

When querying posts that should have meaningful content (e.g. posts a user replied to, posts displayed with text), exclude plain reposts by filtering `text: { not: '' }`.

```typescript
// Excludes plain reposts, keeps originals and quoted reposts
InvestorFeedPost: {
  text: { not: '' },
}

// BAD - Returns plain reposts with no text content
InvestorFeedPost: {}
```
