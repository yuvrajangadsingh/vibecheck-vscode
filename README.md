# vibecheck for VS Code

**ESLint for AI slop.** 32 rules for catching AI-generated code smells in JS/TS and Python, right in your editor.

## Features

- Inline diagnostics (red/yellow/blue squigglies) for AI code smells
- Problems panel integration
- Status bar indicator showing issue count
- Runs on save, or trigger manually
- Configurable severity threshold
- Reads `.vibecheckrc` / `.vibecheckrc.json` from your project

## What it catches

- Hardcoded secrets and SQL injection
- Empty catch blocks and swallowed promises
- Stub functions (`throw new Error("not implemented")`)
- Hedging comments ("should work hopefully")
- Step-by-step comments (`// Step 1:`, `// Step 2:`)
- ASCII section dividers (`// ========`)
- Deep nesting (4+ levels)
- `as any` type escapes
- console.log pollution
- And 23 more rules

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `vibecheck.enable` | `true` | Enable/disable diagnostics |
| `vibecheck.runOnSave` | `true` | Run when files are saved |
| `vibecheck.severity` | `info` | Minimum severity to show (`error`, `warn`, `info`) |

## Commands

- **vibecheck: Run on Current File** - manually trigger a scan

## Links

- [GitHub](https://github.com/yuvrajangadsingh/vibecheck)
- [CLI & GitHub Action](https://github.com/marketplace/actions/vibecheck-ai-slop)
- [Rules reference](https://github.com/yuvrajangadsingh/vibecheck#rules)
