Scan the project for tech debt indicators and produce a health report.

Optionally accepts a path argument to scope the scan (e.g., `/tech-debt src/profile`). Defaults to the full `src/` directory.

Follow these steps:

1. **Determine scan scope**:
   - If $ARGUMENTS is provided, use it as the target path
   - Otherwise, scan `src/` (or the project root if no `src/` exists)
   - Detect the project type from the working directory per CLAUDE.md rules

2. **Scan for debt indicators**:

   ### Code Markers
   - **TODO / FIXME / HACK / XXX comments**: Count and list with file:line
   - **`@ts-ignore` / `@ts-expect-error` / `any` type assertions**: Suppressed type safety
   - **`eslint-disable` comments**: Suppressed lint rules (especially broad disables without specific rule names)

   ### Code Smells
   - **Large functions**: Functions/methods over 50 lines (use heuristic — count lines between function opening and closing brace)
   - **Deep nesting**: 4+ levels of indentation (nested if/for/try blocks)
   - **Empty catch blocks**: `catch (e) {}` or `catch { }` with no error handling
   - **Console leftovers**: `console.log`, `console.debug`, `console.warn` in production code (not in test files)

   ### Staleness
   - **Dead exports**: Exported functions/types that have zero imports elsewhere in the project (sample — don't scan exhaustively)
   - **Commented-out code blocks**: Multi-line commented code (3+ consecutive commented lines that look like code, not documentation)

3. **Produce the report**:

   **Summary table:**
   ```
   | Category | Count | Severity |
   |----------|-------|----------|
   | TODOs/FIXMEs | 12 | low |
   | Empty catch blocks | 3 | high |
   | Console leftovers | 7 | medium |
   | ... | ... | ... |
   ```

   **Top 10 hotspots** (files with the most findings):
   ```
   | File | Issues | Top Category |
   ```

   **Detailed findings** (grouped by category):
   - List each finding with file:line and a one-line description
   - Cap at 20 per category to avoid overwhelming output

4. **Suggest prioritization**:
   - High severity: empty catches, `@ts-ignore` on critical paths, large functions with complex logic
   - Medium severity: console leftovers, TODO/FIXME clusters, deep nesting
   - Low severity: individual TODOs, minor style issues
   - Recommend which items to address first based on risk and effort
