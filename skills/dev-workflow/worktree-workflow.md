# Worktree Workflow

Background sessions (the agents view) and parallel work each run in their own git worktree, so two sessions never edit the same checkout.

## Run / Never

- In a background session, `EnterWorktree` before the first edit; it works only for the session's own repo § Entering a worktree
- For any other repo, `git -C <repo> worktree add .claude/worktrees/<name> -b <branch> origin/main`, never `EnterWorktree` § Another repo
- Rename the worktree branch to `{user}/{issue}-{slug}` before the first push § Entering a worktree
- Symlink `node_modules` (and gitignored env files the build reads) from the main checkout, never copy secrets § Setting up a fresh worktree
- Regenerate generated clients (Prisma, codegen) in the worktree after every rebase § Generated code is per-worktree
- Treat another session's worktree as read-only; commit there only with `git commit --only <paths>` § Someone else's worktree
- Never bare `git stash` / `stash pop` — the stash stack is shared across worktrees § Stash

---

## Entering a worktree

`EnterWorktree({ name })` creates `.claude/worktrees/<name>` on branch `worktree-<name>`, branched from `origin/<default>`. Then:

```bash
git branch -m ilken/42-short-slug      # the branch convention, before the first push
```

Check the base first: if the work continues an unmerged branch, `git log origin/main..<branch>` and rebase onto it rather than redoing it. Commit before the session ends — the worktree can be deleted with it.

## Another repo

`EnterWorktree` only accepts the launch repo's worktrees. For a second repo, use absolute paths and `git -C`:

```bash
git -C ~/Developer/<repo> worktree add .claude/worktrees/<name> -b ilken/<slug> origin/main
git -C ~/Developer/<repo>/.claude/worktrees/<name> commit -m "..."
```

`git -C` makes `bin/branch-guard.sh` check the target repo's branch, not the session's. A `cd … && git commit` does not.

## Setting up a fresh worktree

A new worktree has no `node_modules`, no generated code and no gitignored env files, so `tsc` reports hundreds of bogus errors. Fix, don't triage:

```bash
ln -s <main-checkout>/node_modules <worktree>/node_modules
ln -s <main-checkout>/.env.local   <worktree>/.env.local    # only if the build/test reads it
```

Symlink with **absolute** targets; a copy can hit a deny rule and duplicates secrets. Turbopack builds may reject a symlinked `node_modules` ("points out of the filesystem root") — then `cp -cR` it and `yarn install --frozen-lockfile` in the copy.

## Generated code is per-worktree

Prisma clients generated into the source tree, GraphQL codegen output and similar are gitignored and go stale per worktree. After a rebase onto a `main` that changed the schema, regenerate (`yarn prisma generate` or the project's script) before trusting `tsc`. Phantom type errors in files outside your diff right after a clean rebase = stale generated code.

## Jest and sibling worktrees

Jest run from the main checkout also discovers specs under `.claude/worktrees/*`, so duplicate suites run and collide (shared test DB, duplicate manual mocks). Run tests from inside your own worktree. From the main checkout only, pass `--modulePathIgnorePatterns "/.claude/worktrees/"` with spec paths after `--`. Never pass that flag from inside a worktree: it excludes the worktree itself and reports `No tests found`.

## Someone else's worktree

Fine for running tests against its branch. Its index may hold that session's staged work, so `git add && git commit` sweeps it in — use `git commit --only <paths>`.

## Stash

Prefer a WIP commit. If you must stash: `git stash push -u -m "<unique-tag>"`, apply by SHA, then drop your own entry.

## Cleanup

`/code:cleanup-worktrees` removes worktrees whose PR merged or closed; dirty ones are left for you.
