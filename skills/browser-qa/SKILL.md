---
name: browser-qa
description: Drive a real Chrome browser to QA a web page you changed — navigate, click, type, read the DOM, console and network, screenshot, and design-check against Figma — via the Claude in Chrome extension, with a Playwright fallback for breakpoints or when the extension is not connected. Use when you need to see a page rather than infer it from the diff, walk a user flow, check a client-rendered or logged-in page, or verify a web change before a PR.
---

# Browser QA

See and drive the real page: **screenshot → read → decide → act → repeat**. The native-app counterpart is `app-dev/sim-qa.md`.

## Run / Never

- Check the integration before the first browser step (`/chrome`: `Status: Enabled`, `Extension: Installed`) § Setup
- Load the `mcp__claude-in-chrome__*` tools in one ToolSearch call; start with `tabs_context_mcp`, open your own tab § The loop
- Never drive a destructive action against production; read-only prod is fine, writes need a yes § Real browser
- Never trust a `resize_window` screenshot for a breakpoint — use the Playwright fallback § Fallback
- Never trigger `alert` / `confirm` / `prompt`; a modal blocks every later command § Troubleshooting

## Setup

- Install the [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) once (the user must; Claude can't), start the session with `claude --chrome`, restart Chrome after the first enable.
- Needs `/login` on a direct plan; API-key or `setup-token` sessions keep Chrome off even with `--chrome`.
- Prefer the flag over "enabled by default": the browser tools cost context in every session.

## The loop

1. Validate the code first (`dev-workflow/changes-validation.md`); don't QA a page that doesn't compile.
2. Start the dev server as a background task (`yarn dev`) and wait for it to answer before navigating.
3. Screenshot and read it like a reviewer: layout, spacing, truncation, loading/empty/error states, dark mode.
4. Read the console **by pattern** (errors and warnings), never in bulk. Network only when something looks like a data problem.
5. Walk the flow one step at a time, screenshotting before and after each state change. Save numbered files to the scratchpad (`01-load.png`, `02-after-submit.png`).
6. Report per step what you saw, each console error with its source line, and a verdict: works / broken / needs a decision.

**The first screenshot after a navigate can race the paint** (layout right, images grey, text missing). Take a second before concluding anything; check the DOM (`document.fonts.status`, `img.complete`).

**Design check vs Figma:** take measurements, not just the picture. Read computed styles and bounding boxes (`javascript_tool`) and compare with the frame's `get_metadata` numbers; `scrollWidth - clientWidth` should be 0.

## Real browser

Tabs open in the user's visible Chrome and inherit their logged-in sessions. Login pages and CAPTCHAs hand control back to the user — don't route around them. GIF recordings capture everything visible; review before sharing.

## Fallback

No extension, or a breakpoint check (`resize_window` resizes the OS window, not the viewport): drive real Chrome headlessly with Playwright. The script must live in the **repo root** (so `require('playwright')` resolves), named `.qa-<slug>.js`, deleted before committing:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
```

This is a one-shot driver, not a committed e2e suite.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Extension: Not detected` | Enabled at `chrome://extensions`? Restart Chrome — the native host is read at startup |
| "not connected" / "Receiving end does not exist" | `/chrome` → Reconnect extension |
| Every command hangs | A JS modal is open; the user dismisses it |
| Wrong browser used | `/chrome` → Select browser |
