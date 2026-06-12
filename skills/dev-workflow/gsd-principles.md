# GSD Principles

Nine principles for getting stuff done efficiently.

---

## 1. Bias to Action

Start with the simplest approach that could work. Iterate from there.
Do not spend 20 minutes planning a 5-minute change.

## 2. Ship Over Perfect

Working code beats elegant code that is late. Get it working first,
then refine only if needed.

## 3. Cut Scope Ruthlessly

Do the minimum that solves the problem. If a requirement is ambiguous,
ask -- do not assume the larger interpretation.

## 4. One Thing at a Time

Finish the current task before starting another. Context-switching
is expensive and leads to half-done work.

## 5. Fail Fast

If an approach is not working after 2 attempts, try a different angle.
Do not keep hammering the same broken path.

## 6. No Gold-Plating

Do not add features, refactor surrounding code, or make improvements
beyond what was asked. A bug fix does not need a refactor.

## 7. Ask When Stuck

If blocked for more than 5 minutes, ask the user. A quick question
saves more time than guessing wrong.

## 8. Leave It Better

Fix small issues you encounter along the way -- broken imports, typos,
dead code in files you are already editing. But do not go on a
refactoring spree.

## 9. Pause on Complexity

For non-trivial changes (multi-module, unfamiliar patterns, tricky state),
pause and ask: "Is there a simpler way to do this?" before committing to
the approach. This is a brief reflection, not a design review -- spend
30 seconds, not 30 minutes.

**Subordinate to principles 1, 2, and 6.** If the simpler way is not
obvious within a moment, proceed with the current approach and ship it.
This principle exists to catch accidental over-engineering, not to
encourage it.

---

These principles are ordered by priority. When two principles conflict,
the higher-numbered one yields. For example, "Leave It Better" (#8)
never overrides "No Gold-Plating" (#6) -- only fix incidental issues,
not structural ones.
