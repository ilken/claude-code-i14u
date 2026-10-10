# Writing Rules

Governs everything you write that is not code: skills, commands, plans, issues, PR bodies, learnings, and answers in chat. `code-comments.md` governs comments inside code.

---

## 1. Economy

**If ten lines can be one line, write the one line.**

> Does deleting this sentence lose a rule, a number, or a name?

If not, delete it.

### Delete on sight

- **Preamble** justifying a rule before stating it. A reason earns a place only when it changes what you would do.
- **Restating Claude Code's defaults.** Only deltas earn a line.
- **Duplication.** A rule lives in exactly one file; everywhere else links to it.
- **A second example.** One per rule.
- **Teaching a public tool** (`gh`, `git`, Tailwind, the Conventional Commits spec). Link it or assume it.
- **Narrative where a table fits.**
- **Motivational restatement** and **changelogs about the file itself**.

### Budgets

| Artifact | Cap |
|---|---|
| Command file | 40 lines |
| Skill reference file | 120 lines |
| Learnings entry | 10 lines |
| CLAUDE.md table cell | 1 line |

Over budget means narrating, not instructing. Cut it, or split it and link.

### The first 80 lines

Agents often read `head -80` and grep the rest. **What an agent must run, or must never do, sits in the first 80 lines.** When it cannot move up, open the file with a `## Run / Never` block: one line per item, ending `§ <section heading>`.

---

## 2. Citation

**Never guess. Find it, then name where you found it.**

| Need | Source |
|---|---|
| What the code does right now | the code — `path/to/file.ts#symbol` or `path:line` |
| What we decided | the issue, PR or plan file — `#42`, `plans/x.md` |
| How a library behaves | its docs (context7) or source in `node_modules` |
| A number | the command or query that produced it, shown beside it |

Never write an unverified reference: confirm by grep or read first. Line numbers rot; prefer a symbol.

Label the grade when you could not confirm a claim. An ungraded claim reads as confirmed.

- **confirmed** — you read it and can name the file or output
- **inferred** — reasoned from something you did read; say what
- **not verified** — you could not check; say what you would need

Close any answer carrying the third kind with a `## Not verified` list. **Don't invent numbers.**

---

## 3. Plain sentences

For text a person acts on (QA steps, plan comments, run summaries, follow-ups, PR summaries):

1. One instruction per sentence, imperative.
2. 20 words at most in a step, 25 in a description.
3. Active voice; name the actor.
4. One word per meaning.
5. No more than three nouns stacked.
6. Keep "the", "a" and "that".

Apply to new text; don't rewrite old files to comply.
