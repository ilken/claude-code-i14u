# Simulator QA — See, Drive, and Design-Check the App

Run an Expo / React Native app on the iOS Simulator and interact with it the way a tester would: take screenshots (Claude reads PNGs directly), inspect the accessibility tree, tap/type/swipe via **idb**, jump between screens with deep links, and compare what renders against Figma. Use this whenever you need to *see* a screen you built, walk a user-described flow step by step, or verify a design matches its Figma frame.

**For web pages, use the `browser-qa` skill instead.** Same screenshot, read, act loop, driving a real Chrome browser via the Claude in Chrome extension. This skill is for the native app.

**Scope: simulator only.** The physical iPhone is visible via `devicectl` (install/launch works) but there is no CLI screenshot path — Xcode 26's `devicectl` has no capture command, and neither idb nor Maestro can drive a real iPhone. For device-only issues, ask the user for a screenshot (or QuickTime mirror + Cmd+S) and Read the file they share. For scripted regression suites, prefer the repo's own Maestro flows if it has them (the local Maestro CLI is free; only Maestro Cloud is paid).

## Quick Reference

| Action | Command |
|---|---|
| Boot sim | `xcrun simctl boot <UDID>` |
| Screenshot | `xcrun simctl io <UDID> screenshot <path>.png` |
| Launch app | `xcrun simctl launch <UDID> <bundle-id>` |
| Kill app | `xcrun simctl terminate <UDID> <bundle-id>` |
| Deep link | `xcrun simctl openurl <UDID> "<url>"` |
| Record video | `xcrun simctl io <UDID> recordVideo <path>.mp4` (background it; SIGINT to stop) |
| Element tree | `~/.local/bin/idb ui describe-all --udid <UDID>` |
| Tap / type / swipe | `~/.local/bin/idb ui tap <x> <y>` / `ui text "..."` / `ui swipe x1 y1 x2 y2` |
| Metro (bg) | `node node_modules/expo/bin/cli start --dev-client` |
| Rebuild dev client (bg) | `node node_modules/expo/bin/cli run:ios --no-bundler --device <UDID>` |

## Run / Never

- Call idb by full path, never via PATH; PATH exports can be denied in sandboxed shells. § One-Time Machine Setup
- Screenshot after every tap; never chain taps blind. § Field-Tested Gotchas
- Screenshot when the accessibility tree contradicts the last action; iOS system dialogs are invisible to it. § Field-Tested Gotchas
- Reload the dev client after any branch switch, or you QA the previous bundle. § Field-Tested Gotchas
- Never QA a remote-config flag from a screenshot; force it locally, remount, then revert the edit. § Field-Tested Gotchas
- Check `curl -s localhost:8081/status` before restarting Metro. § Field-Tested Gotchas
- Screenshot and confirm the UI is at rest before tapping, after scroll or navigation. § Field-Tested Gotchas
- Undo any state a mis-landed tap changed (likes, follows). § Field-Tested Gotchas

## One-Time Machine Setup

```bash
brew install facebook/fb/idb-companion
pipx install --python /opt/homebrew/bin/python3.13 fb-idb
```

The Python pin matters: fb-idb crashes on Python 3.14 (`asyncio.get_event_loop` removed) and fails to install on 3.9 (`dataclass(slots=)` needs 3.10+). Anything 3.10–3.13 works. The client lands at `~/.local/bin/idb` — **always call it by full path**; PATH exports can be denied in sandboxed shells.

Verify: `"$HOME/.local/bin/idb" list-targets` should list simulators (it will also list the physical iPhone — ignore it, see scope note above).

## Session Bring-Up

Read the project's values first: `<bundle-id>` is `expo.ios.bundleIdentifier` and `<scheme>` is `expo.scheme` in `app.json` / `app.config.*`; `<app-repo>` is the checkout (or your worktree).

1. **Boot a simulator** (skip if one is already `Booted`):
   ```bash
   xcrun simctl list devices available | grep -i iphone
   xcrun simctl boot <SIM-UDID>
   ```
2. **Check the dev client is installed**:
   ```bash
   xcrun simctl listapps <SIM-UDID> | grep -i '<bundle-id>'
   ```
   Missing → do the Rebuild section first.
3. **Start Metro** (background task, keep it running):
   ```bash
   cd <app-repo> && node node_modules/expo/bin/cli start --dev-client
   ```
   - Use `node node_modules/expo/bin/cli`, **not** `yarn start`/`npx expo` — the sandbox can deny `node_modules/.bin/*` shims.
   - **Never set `CI=1`** — it disables watch mode, killing Fast Refresh, which the edit → hot-reload → re-screenshot loop depends on.
   - Verify: `curl -s localhost:8081/status` → `packager-status:running`.
4. **Launch the app** — prefer the dev-client deep link, which connects straight to Metro and skips the launcher screen entirely:
   ```bash
   xcrun simctl openurl <SIM-UDID> "exp+<scheme>://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
   ```
   (`expo run:ios` prints this exact URL when it launches; plain `simctl launch <SIM-UDID> <bundle-id>` works too but lands on the launcher.)
5. **If the Expo dev launcher appears** (cold start via plain launch): screenshot it, find the dev-server row (labeled like `<APP NAME>, http://<ip>:8081`) via `describe-all`, tap it. The first bundle can take a minute — watch the Metro log for `iOS Bundled` before screenshotting again.
6. **Logging in**: use the project's test account (its CLAUDE.md or e2e config); ask if there is none. Expect first-run modals and iOS system dialogs on a fresh install.

## Stale Dev Client → Rebuild

If the JS bundle redboxes with `Property 'MessageQueue' doesn't exist` or `Cannot find native module 'X'`, the installed binary predates the current JS dependencies (native module added / RN upgraded since it was built). Rebuild — long (10–20 min), always background it:

```bash
cd <app-repo> && node node_modules/expo/bin/cli run:ios --no-bundler --device <SIM-UDID>
```

`--no-bundler` reuses the Metro you already started. If `pod install` fails with a changed-constraint error (the lockfile pins one pod version, the JS package now needs another), don't fix pods one by one — updating a single pod just surfaces the next stale one. The whole generated `ios/` folder is out of date; regenerate it (`ios/` is gitignored, nothing of value is lost):

```bash
cd <app-repo> \
  && node node_modules/expo/bin/cli prebuild --clean --platform ios \
  && node node_modules/expo/bin/cli run:ios --no-bundler --device <SIM-UDID>
```

If the repo has its own `prebuild` script with extra steps, run those too.

## The QA Loop

The core cycle is **screenshot → read → decide → act → repeat**. Save screenshots to the session scratchpad, numbered per step (`01-launch.png`, `02-after-tap.png`) so before/after pairs stay legible.

**1. See the screen:**
```bash
xcrun simctl io <SIM-UDID> screenshot <scratchpad>/01-home.png
```
Then Read the PNG. Assess it like a reviewer would — layout, spacing, truncation, loading states — not just "did it render".

**2. Read the structure** (labels, testIDs, tap coordinates):
```bash
"$HOME/.local/bin/idb" ui describe-all --udid <SIM-UDID>
```
Output is one JSON array of every element. Filter it down — the raw dump is huge:
```bash
... | python3 -c "
import sys, json
for e in json.load(sys.stdin):
    label, f = e.get('AXLabel') or '', e.get('frame')
    if label and f:
        print(f\"{e.get('type','?'):12s} ({f['x']:.0f},{f['y']:.0f} {f['width']:.0f}x{f['height']:.0f})  {label[:60]}\")
"
```
Elements carry the same testIDs the Maestro flows use, so components are findable by stable IDs, not just visible text.

**3. Act.** Tap the element's *center* (`x + width/2`, `y + height/2`):
```bash
"$HOME/.local/bin/idb" ui tap <x> <y> --udid <SIM-UDID>
"$HOME/.local/bin/idb" ui text "hello"          # types into the focused field
"$HOME/.local/bin/idb" ui swipe <x1> <y1> <x2> <y2> --duration 0.3
```

**Coordinate trap:** `describe-all` frames are in **points** (e.g. 402×874 on iPhone 16 Pro); screenshots are **pixels at 3×** (1206×2622). Always tap using describe-all coordinates. Never derive tap targets from screenshot pixel positions.

**4. Wait without `sleep`.** Foreground `sleep` is blocked. Natural tool-call latency usually covers UI transitions; when it doesn't, re-screenshot and check. For long waits (bundling, network), grep the Metro log or use a background `until` loop.

**5. Deep-link shortcut.** Any screen with a route is reachable without tapping:
```bash
xcrun simctl openurl <SIM-UDID> "<scheme-or-universal-link-url>"
```
Prefer this over long tap sequences — it removes every intermediate screen as a failure source. Find routes in the app's linking config or wiki `attribution-and-deep-links.md`.

**6. Iterate on code.** Edit source → Metro Fast Refresh applies it live → re-screenshot. No relaunch needed for JS/style changes (this is why CI=1 is forbidden). Native-module changes need a rebuild.

## Field-Tested Gotchas

These all bit during the first live run — each one costs minutes if rediscovered:

- **iOS system dialogs are invisible to `describe-all`.** Notification-permission alerts, the Save Password sheet, and other SpringBoard UI belong to the OS, not the app, so the accessibility tree keeps showing the screen *behind* them. If the tree looks stale or contradicts the last action, screenshot — the truth is in the pixels. Dismiss system alerts by converting screenshot pixel coordinates to points (÷3 on current iPhones) and tapping.
- **Tap the pressable word, not the element center.** A row like `Have an account? Log In` is exposed as one accessible element spanning the whole sentence, but only the `Log In` substring has the press handler. If tapping an element's center does nothing, estimate the pressable text's position from the screenshot and tap that.
- **Screenshot after every tap — never chain taps blind.** Modals dismiss asynchronously and the next tap lands on whatever is underneath (a rules-modal CONTINUE tap also opened the chat row behind it). One screenshot per action keeps you oriented and produces the evidence trail for free.
- **Forms may submit implicitly.** Typing into the last field can trigger submission (login fired without tapping a button). After `ui text`, check the screen state before hunting for a submit button.
- **A branch switch does not hot-reload — reload the dev client or you QA the previous bundle.** Fast Refresh reconciles edits to modules it already knows; checking out a branch that adds whole new files is not that. The app keeps serving the pre-checkout bundle, so a new screen renders as blank and reads as broken. Re-open the dev-client deep link (step 4) after any `git checkout`, and treat a blank screen as unproven until you know which bundle produced it.
- **A fail-closed flag's pending state can render identically to its enabled state.** Hooks that return `undefined` while a Firebase read is in flight often hold a neutral UI that also happens to be the flag-on UI, so a screenshot cannot tell you the flag's value (a hanging read looks like "enabled"). Read the config source instead, or force the value locally by patching the resolver hook and reverting the file afterwards — flipping Remote Config is an exposure decision, not a QA step.
- **Metro outlives its parent shell.** A background task "completing" doesn't mean Metro died — verify with `curl -s localhost:8081/status` before restarting. A second `expo start` on a taken port exits with "Skipping dev server" in non-interactive shells rather than prompting for 8082.
- **Wedged CoreSimulator: screenshots work but `listapps`/`openurl`/`get_app_container` hang forever.** A sim can report `Booted` while its launchd bridge is stuck. Recover with `osascript -e 'quit app "Simulator"'; pkill -9 -f CoreSimulatorService`, then re-boot the target sim — hung simctl calls flush out the moment the service dies.
- **Find which simulator has the dev client without simctl** (works even when the service is wedged): `ls -d ~/Library/Developer/CoreSimulator/Devices/*/data/Containers/Bundle/Application/*/*.app | grep -i '<app name>'`. The UDID in the path is the sim to boot — don't assume the currently-booted one has the app.
- **Header taps can navigate late.** After tapping a header element (avatar, "..."), the screenshot may still show the old screen while `describe-all` already shows the new one — the tree is ahead of the animation, not stale. Re-screenshot before concluding the tap failed; a repeated tap can fire on the wrong screen (e.g. popping two levels).
- **Taps during scroll settle or nav transitions are swallowed or land elsewhere.** A tap while a list is still decelerating stops the scroll instead of pressing, and a tap fired right after `openurl`/back lands on the outgoing screen. Screenshot, confirm the UI is at rest, re-derive coordinates from that screenshot, then tap. (A mis-landed tap can hit a real control — one such tap liked a post; undo any accidental state changes.)
- **A long-press drag (`react-native-sortables`) cannot be driven from the CLI. Seed the ref instead.** `idb ui swipe` starts moving on the first touch point, so `Sortable.Grid` reads it as a scroll and the row snaps back; `--duration 8 --delta 1` fails the same way, and the accessibility tree mid-gesture looks like a real drag (rows shifted, a gap where the item would drop) so it is easy to believe it worked. Confirm against a screenshot, not the tree. The native-mouse routes are all closed too: no `Quartz`/pyobjc, no `cliclick`, and `osascript` mouse control needs Accessibility permission only the user can grant. Test the *app's* half instead by temporarily seeding whatever the gesture would have written (e.g. `reorderedArtists.current = [artists[1], artists[0], ...artists.slice(2)]` in a `useEffect`) and then tapping Save: that covers the mutation contract, the optimistic write, invalidation and persistence, leaving only the library's gesture unverified. Re-run the same seeded swap a second time to restore the original data before reverting the edit.
- **To verify press feedback, hold the tap and screenshot mid-press, then measure the pixels.** `idb ui tap --duration 2.5 <x> <y>` backgrounded (`( ... & )`), then `sleep 1` and screenshot, captures the pressed state that an instant tap never shows. Judge it by sampling rather than by eye: `PIL` median over a small empty patch of the surface distinguishes a real change from imagination (a working `PressableHighlight` on a dark card read rgb(35,35,37) at rest vs rgb(47,47,50) pressed). Expect the held tap to still fire `onPress` on release, so pick a target whose navigation you can undo, and restore any state it changes.
- **Remote-config-gated features: force the flag locally, then remount the screen.** Editing the flag hook to resolve `true` (temp, never committed) is the fastest override, but Fast Refresh preserves already-resolved `useState` — resolve-once hooks keep their old value until the screen unmounts. Back out and re-enter the screen after the edit; then revert the edit before committing.

## Walking a User-Described Flow

When the user describes a flow in plain English ("open profile, tap Edit, change the name, save"), execute it Maestro-style but reason at every step:

For each step: `describe-all` → locate the element by label/testID → tap → screenshot → check the result matches the step's expectation. If a screen doesn't match what the flow implies (error state, unexpected modal, missing button), **stop and report with the screenshot** rather than forcing the flow onward. Keep the numbered screenshot trail as the flow's evidence.

## Figma Comparison

Follow `figma-workflow.md` for fetching designs. Per screen:

1. `mcp__claude_ai_Figma__get_screenshot` on the frame → the design's rendered image.
2. `mcp__claude_ai_Figma__get_design_context` → exact spacing, colors, typography.
3. Compare the sim screenshot against both. Judge **semantically** — spacing, colors, font sizes/weights, alignment, missing/extra elements — and map every discrepancy to design tokens (`Color.*`, `FontStyles.*`, `SPACING_*`). This is not a pixel diff; fonts and shadows never pixel-match across renderers, and flagging that noise wastes the user's time.
4. Report discrepancies as a list: element → what the design says → what the app renders → suspected code location.
