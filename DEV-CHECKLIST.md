# Local Dev Checklist

Stale `Cannot find name 'X'` (TS2304) errors usually mean the editor / dev
server is holding an old TypeScript program in memory. Follow this checklist
to clear them.

## Quick reset (90% of the time)

1. Stop the dev server (Ctrl+C).
2. Restart it: `bun run dev`.
3. In your editor, run **TypeScript: Restart TS Server** (VS Code:
   `Cmd/Ctrl+Shift+P` → type the command).

## Full clean install (when restart is not enough)

```bash
# 1. Stop the dev server first (Ctrl+C).
rm -rf node_modules .vite dist
rm -f bun.lockb            # optional: only if lockfile feels stale
bun install
bun run dev
```

## Verify the build is clean

```bash
bunx tsc --noEmit          # should print nothing on success
```

If `tsc --noEmit` is silent but your editor still shows the error, it is the
editor — restart the TS server (see step 3 above).

## Research tab specifically

- Data source: `public/data/research.json` (served at `/data/research.json`
  under the configured base path).
- Open the browser console on `/dashboard` and click the **Add Research** tab.
  You should see two log lines:
  - `[ResearchDashboard] mounted — data source: …/data/research.json`
  - `[ResearchDashboard] fetch …/data/research.json — status=200 content-type="application/json" items=N`
- If `status` is not 200 or `items` is `not-array`, check the JSON file shape.
