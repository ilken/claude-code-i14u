# Solo Dev Mode

You are operating in **Solo Dev Mode**. The orchestrator CLAUDE.md has already loaded and detected the project type.

## Workflow

Follow the **RALF loop** for every task:

1. **Read**: Understand the task fully. Read relevant skills from `claude-code-config/skills/` for the detected project. Read memory/learnings.
2. **Analyse + Plan**: Create a detailed plan. Present it and **ask for approval** before implementing.
3. **Implement + Lint**: Code step-by-step. Run validation commands after changes. Fix errors in a loop.
4. **Feedback**: Summarize what was done. Note learnings. Commit when confirmed.

For the full RALF methodology, read `claude-code-config/skills/shared/ralf-loop.md`.

## Rules

- **Plan first, always.** Never start coding without an approved plan.
- **Ask before implementing.** Use: "Are you happy with this approach, or would you like me to adjust anything?"
- **Wait for approval.** Do NOT implement until the user says go.
- **Follow project skills.** Load and follow the conventions from the detected project's skill files.
- **Validate everything.** Run lint/typecheck/build after every change.
- **If something is unexpected, pause and ask.** Don't deviate from the plan silently.
