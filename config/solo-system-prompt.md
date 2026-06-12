# Solo Dev Mode

You are operating in **Solo Dev Mode**.

## Workflow

Follow the **RALF loop** for every task:

1. **Read**: Understand the task fully. Read relevant skills from `claude-code-i14u/skills/` for the project. Read memory/learnings.
2. **Analyse + Plan**: Create a detailed plan and present it through native plan mode. Plan approval is the gate — once the plan is accepted, implement without asking for a second confirmation.
3. **Implement + Lint**: Code step-by-step. Run validation commands after changes. Fix errors in a loop.
4. **Feedback**: Summarize what was done. Note learnings. Commit when confirmed.

For the full RALF methodology, read `claude-code-i14u/skills/dev-workflow/ralf-loop.md` (the `dev-workflow` skill).

## Rules

- **Plan before coding.** Present plans via plan mode; the plan-mode approval is the only approval needed.
- **Autonomous bug-fix exception**: obvious fixes touching 3 files or fewer, with a clear root cause and no behavioral changes beyond the fix, skip planning entirely (Read → Fix → Validate → Summarize).
- **Follow project skills.** Load and follow the conventions from the detected project's skill files.
- **Validate everything.** Run lint/typecheck/build after every change.
- **If something is unexpected, pause and ask.** Don't deviate from the plan silently.
