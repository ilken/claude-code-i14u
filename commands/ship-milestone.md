Ship every open issue in the GitHub milestone `$ARGUMENTS`, one at a time: order by dependency, check the milestone holds together, run each issue through `/ship` in a subagent, answer its questions yourself, verify, merge, and only then start the next.

`/ship` owns one issue up to a green PR. This command owns the queue, the ordering, the milestone's coherence, the questions and the merge. It is the only layer allowed to merge.

## Modes

- **Full run** (default).
- **`--plan`** as the last token: Phases 0–2 only, print the table, stop. Nothing spawned, commented, closed or merged. Still writes the run state file, marked `plan-only`.

## Authority (pre-authorised by starting a full run)

Merge PRs this run created once green (`gh pr merge <pr> --squash --delete-branch`); comment on and close milestone issues; answer the subagent's questions with the simplest option that meets the acceptance criteria. **A PR touching a migration or schema file always needs an explicit yes** (step 14). Never: commit to main, force-push anything but a subagent's own branch after a rebase, merge a PR this run didn't create, touch issues outside the milestone.

## Phase 0 — Resolve

1. `$ARGUMENTS` is a milestone title or number, optionally `in <owner/repo>` (default: the cwd's repo). `gh api repos/{owner}/{repo}/milestones?state=open`; ambiguous or missing → list candidates and stop.
2. `gh issue list --milestone "<title>" --state open --limit 200 --json number,title,body,labels`.
3. **Resume:** if `~/.claude/ship-milestone/{repo}--{milestone-slug}.md` has unfinished issues, re-read each issue's state and PR, and resume that queue. Never re-ship a merged one.

## Phase 1 — Triage and order

4. Classify: `shippable` (a code change here), `human-setup` (done lives outside the repo: a console, a store listing, a secret, DNS, a prod data change — never queued, listed for the user), `investigation` (output is an answer — offered separately).
5. Order on `Blocked by #N` lines, blockers first; a blocker outside the milestone that's still open parks the issue. A cycle is a stop: report it and ask which edge to break. Add edges GitHub doesn't record (B consumes a field, endpoint, flag or column A creates → A first) and **mark them inferred**. Tie-break: backend → web → app, then issue number. **Cap: 12 issues per run.**

## Phase 2 — Coherence pass, then approve (the only planned stop)

6. Before any code, with targeted greps or an `Explore` agent per question: **already done** on main (close with a comment saying where it lives), **contradictions** between issues, **overlap** (merge them or make the dependency explicit), **gaps** the milestone outcome needs that no issue covers (propose a new issue, never widen one), and **every intermediate state safe** if the run stops after any merge.
7. Publish the run board (`dev-workflow/visual-outputs.md`), print its link, then one table: position, issue, title, class, blocked by, why for inferred edges; under it the coherence findings with proposed actions, the `human-setup` list, parked issues, and expected schema-change stops.
8. Ask for a go and wait (`--plan` ends here). After the go: apply the agreed actions (close done issues, create proposed ones in the milestone), then run autonomously. Already approved earlier in the session → don't ask again.

## Phase 3 — Per issue, all the way to merged

9. `git -C <repo> fetch && git -C <repo> checkout <default> && git -C <repo> pull --ff-only`; confirm the previous merge is present. Uncommitted work in the checkout → stop and ask.
10. Spawn one `general-purpose` agent named `ship-<n>`, `isolation: "worktree"`: `model: "sonnet"` for a clear single-area issue; for a complex one (data model, 5+ files, auth, payments) write and grill the plan yourself first, post it on the issue, and hand it over. The prompt: read `~/.claude/commands/ship.md` and follow it for issue #N; **scope ends at a green PR** (no merge); never wait for the user — return `NEEDS-DECISION` instead; include the plan if any, inferred dependencies, relevant coherence findings, and one line on what earlier merged issues changed. Required report: `STATUS:` GREEN / NEEDS-DECISION / NEEDS-ATTENTION, `PR:`, `BRANCH:`, `DECISIONS:`, `QUESTION:` (with recommendation), `FOLLOW-UPS:`, `LEARNINGS:`.
11. `NEEDS-DECISION` → answer from the code, issues or an `Explore` agent, not a guess; reply with a decision and reason via `SendMessage({ to: "ship-<n>" })`. **Cap: 5 round-trips per issue**, then ask the user.
12. Don't take GREEN on trust: `gh pr view <pr> --json state,mergeable,mergeStateStatus,statusCheckRollup`. Anything failing or conflicting goes back to the agent.
13. Read `gh pr diff <pr>` yourself — you're the last reviewer. Anything failing `self-review-checklist.md` or a coherence finding goes back.
14. **Schema gate:** `gh pr diff <pr> --name-only`; any migration or schema file → print it, name destructive steps (dropped table/column, type change, `NOT NULL` without default, a lock-taking index on a big table), republish the board with the gate on top, `PushNotification`, and wait for a yes.
15. Merge: `gh pr merge <pr> --squash --delete-branch` (if branch deletion fails because a worktree holds it, confirm `state: MERGED` and `git push origin --delete <branch>`; never re-merge). Confirm the issue closed. Watch the default branch's CI for the merge commit: red because of this merge → stop the queue.
16. Update the run state file and start the next issue.

## When to stop and ask

Stop the queue, republish the board with the stop on top, `PushNotification` (`⚠️ <milestone>: #<n> needs you — <reason>`), wait. Stop for: anything outside the repo, a destructive step, a product decision with no guidance where options differ materially for users, someone else's unmerged work, a cycle, a red default branch, a dirty checkout, a schema gate, a semantic rebase conflict, 5 questions or 2 failed attempts on one issue. Don't stop for a decision you can make, a CI flake, a review disagreement or a missing simulator/extension (that's design-check-pending).

## Run state

`~/.claude/ship-milestone/{repo}--{milestone-slug}.md`, current after every transition: the ordered queue with states (`queued`, `in-progress`, `blocked`, `merged`, `skipped`), PRs, merge commits, coherence findings and outcomes, answered questions, the `human-setup` list, the board URL.

## Phase 4 — Finish

17. Batch the subagents' `LEARNINGS:` (deduplicated) into one `claude-code-i14u` PR, merged per the auto-merge rule.
18. `PushNotification`: `✅ <milestone>: <n>/<total> merged` or `⚠️ <milestone>: stopped at #<n>`. Republish the board with the verdict, print its link, and give the final report: queue outcomes, PRs with merge commits, coherence findings, decisions made for the user, outstanding `human-setup` and parked issues, pending design checks, uncovered gaps.
