List the handoff documents in `~/.claude/handoffs/`, newest first, with status. Read-only.

1. `ls -1 ~/.claude/handoffs/*.md 2>/dev/null`. Empty or missing → print `No handoffs in ~/.claude/handoffs/ — create one with /handoff.` and stop.
2. Read only the first ~15 lines of each: title (`# Handoff:`), `**Created:**` (else the filename suffix), `**Status:**` (missing → `pending (unlabeled)`), `**Project:**`, `**Issue:**`, `**Depends on:**`. `handoff-index-*.md` files are task sets, collected separately.
3. Print:

   ```
   ## Handoffs — ~/.claude/handoffs/
   | Created | Status | Project | Handoff | Issue |
   ⏳ N pending · 🔨 N in-development · ✅ N completed
   ```

   Icons: ⏳ pending, 🔨 in-development, ✅ completed. Keep file paths plain and copy-pasteable. Then a **Task sets** section per index with its docs' statuses.
4. Offer once to backfill a `**Status:** pending` line on unlabeled docs — that user-approved write is the only one allowed. Suggest archiving `completed` docs older than ~30 days to `~/.claude/handoffs/archive/`.
5. A status that looks stale (pending, but its issue's PR merged) → report the mismatch; don't fix it.
