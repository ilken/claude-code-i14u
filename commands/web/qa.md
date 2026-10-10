Open $ARGUMENTS in a real Chrome browser and QA it: see the page, drive it, read the console. Load the `browser-qa` skill first and follow it.

`$ARGUMENTS` is a URL, a route (`/settings`), or a description of the flow to walk. Empty → ask what to check.

1. **Integration:** `/chrome` shows `Status: Enabled` and `Extension: Installed`. Not enabled → the session needs `claude --chrome` (Claude can't relaunch itself). Extension missing → the user installs it and restarts Chrome. Either way, offer the skill's Playwright fallback.
2. **Target:** a bare route → start the project's dev server as a background task if it isn't up and prefix its URL. A deployed URL → use it as given, **read-only on production**: anything that mutates real data needs an explicit yes.
3. **Validate first** if there are uncommitted changes (`changes-validation.md`). Don't QA a page that doesn't compile.
4. **Loop:** screenshot, read, act, repeat, per the skill — numbered screenshots in the scratchpad, console by pattern, network only for data problems.
5. **Report** per step what you saw, every console error with its source line, a verdict (works / broken / needs a decision), and the screenshot paths. A bug → point at `file:line`; fix it only if it meets the autonomous bug-fix criteria in CLAUDE.md.
