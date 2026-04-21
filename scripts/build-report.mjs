#!/usr/bin/env node
// Verbose post-build report.
//
// Inspects dist/ and prints whether the prerender step succeeded, which
// shell file is present (index.html / _shell.html), whether the server
// bundle was emitted, and the static data feeds shipped in the build.
// Exits non-zero if any required artifact is missing.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const client = join(dist, "client");
const server = join(dist, "server");

const lines = [];
const errors = [];
const log = (s) => lines.push(s);
const fail = (s) => {
  errors.push(s);
  lines.push(`  ✗ ${s}`);
};
const ok = (s) => lines.push(`  ✓ ${s}`);

log("============================================================");
log("Build report");
log("============================================================");

// --- Client artifacts ---
log("\n[client] dist/client/");
if (!existsSync(client)) {
  fail("dist/client/ is missing — did the build run?");
} else {
  const shell = join(client, "_shell.html");
  const index = join(client, "index.html");
  const fourOhFour = join(client, "404.html");

  if (existsSync(shell)) ok(`_shell.html (${statSync(shell).size} B) — prerender succeeded`);
  else fail("_shell.html is missing — prerender did not produce a shell");

  if (existsSync(index)) ok(`index.html (${statSync(index).size} B) — ready for static hosting`);
  else log("  · index.html not present yet (deploy step will create it from _shell.html)");

  if (existsSync(fourOhFour)) ok(`404.html (${statSync(fourOhFour).size} B) — SPA deep-link fallback`);
  else fail("404.html is missing — deep-link refreshes will 404 on GitHub Pages");

  // Static data feeds
  const dataDir = join(client, "data");
  if (existsSync(dataDir)) {
    const files = readdirSync(dataDir).filter((f) => f.endsWith(".json"));
    if (files.length === 0) {
      fail("dist/client/data/ has no JSON feeds");
    } else {
      ok(`data/ contains ${files.length} JSON feed(s): ${files.join(", ")}`);
    }
  } else {
    fail("dist/client/data/ is missing");
  }

  // Hashed asset summary
  const assets = join(client, "assets");
  if (existsSync(assets)) {
    const all = readdirSync(assets);
    const js = all.filter((f) => f.endsWith(".js")).length;
    const css = all.filter((f) => f.endsWith(".css")).length;
    const img = all.filter((f) => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f)).length;
    ok(`assets/: ${js} JS · ${css} CSS · ${img} image(s)`);
  }
}

// --- Server artifacts ---
log("\n[server] dist/server/");
if (!existsSync(server)) {
  log("  · dist/server/ not present (pure-static build)");
} else {
  const idx = join(server, "index.js");
  const srv = join(server, "server.js");
  if (existsSync(idx)) ok(`index.js (${statSync(idx).size} B)`);
  if (existsSync(srv)) ok(`server.js (${statSync(srv).size} B) — prerender entry`);
  else log("  · server.js not present (only needed by SPA prerender)");
}

// --- Base-path sanity check ---
log("\n[base path]");
const candidate = existsSync(join(client, "index.html"))
  ? join(client, "index.html")
  : join(client, "_shell.html");
if (existsSync(candidate)) {
  const html = readFileSync(candidate, "utf8");
  const base = process.env.VITE_BASE_PATH || "/";
  // Look for the first asset reference; it should be prefixed by the base.
  const m = html.match(/(?:src|href)="([^"]+\/assets\/[^"]+)"/);
  if (m) {
    const ref = m[1];
    if (ref.startsWith(base) || ref.startsWith("/assets/")) {
      ok(`asset references use base "${base}" → e.g. ${ref}`);
    } else {
      fail(`asset reference "${ref}" does not start with VITE_BASE_PATH="${base}"`);
    }
  } else {
    log("  · could not locate an /assets/ reference in the shell");
  }
}

log("\n============================================================");
if (errors.length > 0) {
  log(`Build report FAILED — ${errors.length} issue(s):`);
  for (const e of errors) log(`  - ${e}`);
  log("============================================================");
  console.log(lines.join("\n"));
  process.exit(1);
}
log("Build report OK.");
log("============================================================");
console.log(lines.join("\n"));
