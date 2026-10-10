Run the current project's full validation suite and fix issues in a loop until clean.

1. **Detect** the project from the cwd, its `package.json` and its CLAUDE.md. Unclear → ask.
2. **Run** the commands from `~/.claude/skills/dev-workflow/changes-validation.md`, the only copy of them. Loop until clean.
3. **Tests:** if `$ARGUMENTS` names a test path, run it with the project's test command.
4. **Behavioural diff check** for refactors and logic changes: read `git diff` whole and confirm it is scoped to the plan.
5. **Report** what passed, what you fixed, and any remaining warnings.
