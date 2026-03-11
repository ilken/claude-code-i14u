# Figma Design-to-Code Workflow

## Setup

The app repo has a `.mcp.json` that configures the Figma MCP server. It requires a `FIGMA_ACCESS_TOKEN` env var.

To generate a token: Figma → Settings → Personal Access Tokens → create one with read-only file access.

Set it in your shell profile:
```bash
export FIGMA_ACCESS_TOKEN="your-token-here"
```

## How to Point a Design to Fix a Component

When a component doesn't match the Figma design, use this workflow:

### 1. Get the Figma URL

Right-click the frame/component in Figma → **Copy link**. The URL looks like:
```
https://www.figma.com/design/<file-id>/<file-name>?node-id=<node-id>
```

### 2. Ask Claude to Fix It

Paste the Figma URL and tell Claude which component to fix:

```
Fix <ComponentName> to match this design: <figma-url>
```

Claude will:
1. Fetch the design properties from Figma (colors, spacing, typography, layout)
2. Read the current component code
3. Compare and apply the necessary changes using our design system tokens (`Color`, `FontStyles`, `SPACING_*`)

### 3. Examples

**Fix spacing/layout:**
```
The ProfileCard doesn't match the design. Fix it: https://www.figma.com/design/abc123/App?node-id=456
```

**Match a specific frame:**
```
Implement this screen to match: https://www.figma.com/design/abc123/App?node-id=789
```

**Fix just one section:**
```
The header section of SettingsScreen is off. Match this: https://www.figma.com/design/abc123/App?node-id=101
```

## Tips

- **Be specific about which component** — point to the file or component name, not just the screen
- **Copy the exact frame link** — select the specific frame/component in Figma, not the whole page
- **Use node-level links** — right-click → Copy link on the exact element gives a `node-id` parameter that targets precisely what you want
- Claude maps Figma values to our design tokens automatically (`Color.*`, `FontStyles.*`, `SPACING_*`)
- If a Figma value doesn't have an exact token match, Claude will flag it so you can decide whether to add a new token or use the closest existing one
