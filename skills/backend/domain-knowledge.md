# Domain Knowledge

> **Project-specific file.** This should be copied to the project's own `.claude/` folder and filled in with that project's business domain facts, data model quirks, and non-obvious conventions.
>
> This config-level file is just a template. Keep project-specific knowledge at project level.

---

## How to Use

As you discover non-obvious facts about a project's domain, add them here. These are things that aren't visible from the code but that Claude needs to know to make correct decisions.

Good candidates:
- Data model quirks (e.g. a field that means different things based on another field's value)
- Business rules that aren't encoded in types
- Non-obvious relationships between entities
- "We tried X and it broke Y" notes
- Naming inconsistencies between the DB schema and the domain language

---

## Template Sections

### [Entity Name]

#### Behaviour / Rules
Describe any non-obvious business logic or state machine rules for this entity.

#### Data Model Quirks
Describe fields that behave unexpectedly or have hidden meanings.

```
Example:
status = 'pending' means the item has been created but not yet processed
status = 'active'  means it's being processed
status = 'done'    means it completed — but check `result` for success/failure
```

#### Common Query Mistakes

```typescript
// BAD — returns wrong results because of X
query({ where: { status: 'done' } })

// GOOD — must also check Y
query({ where: { status: 'done', result: 'success' } })
```

---

## Add new sections as domain knowledge is discovered
