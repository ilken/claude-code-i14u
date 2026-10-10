# claude-code-i14u — parity with the work setup (claude-code-config)

Bring the solo setup in line with the work repo, minus CircleCI, CodeRabbit and Codex (an Opus reviewer replaces them), Linear (GitHub issues instead), Slack, the domain wiki, Graphify and the ADR store. Sessions mostly run from the agents view as background jobs, so nothing may depend on the `claude-solo` launcher's system prompt.

## Decisions

- `/ship` ends at a green PR and never merges. `/ship-milestone` merges, since running it grants that.
- Review = a fresh-context Opus agent (`charmander`, now on opus) using `dev-workflow/code-review.md`; debate via `SendMessage` replaces the Codex thread.
- CI = GitHub Actions through `gh pr checks`; a repo with no checks skips the CI phase.
- Keep this repo's attribution (Co-Authored-By, PR footer) and the user's model setting.
- Per-project skills: add the generic work-only app skills; don't overwrite the existing generic ones with Equals-specific trims.
- Skipped: claude-board, fleet-group (the agents view already groups by directory), seo:*, linear:*, slack:pr, diagnose, wiki/graph commands, cite-check.

## Steps

- [x] Read both repos
- [ ] CLAUDE.md: core principles, model selection, quick-start map, auto-merge rule for this repo
- [ ] dev-workflow skill: ralf-loop, self-review, pr-workflow, validation + new code-comments, writing-rules, model-selection, plan-grilling, code-review, worktree-workflow, handoff, visual-outputs, before-patching-dependencies; drop gsd-principles
- [ ] debug-mode update; new browser-qa skill; app skills (animations, native-ui-patterns, react-compiler, performance-audit, sim-qa)
- [ ] Commands: ship, mod:ship, ship-milestone, git:pr, code:*, handoff, handoff:list, web:qa, project:qa-checklist
- [ ] bin: branch-guard, rm-guard, pr-check, cleanup-worktrees, session-digest
- [ ] mods/ship-cockpit ported to GitHub Actions, no CodeRabbit/CircleCI/graph
- [ ] Agents: charmander on opus with the review method
- [ ] config/claude-settings.json + setup.sh + README
- [ ] Validate (bash -n, py_compile, jq, plugin validate/test), learnings, commit, PR
