// Vite configuration for the WGBIBA SPA.
//
// Builds a static SPA (TanStack Start + React + Tailwind) that can be
// hosted on any static host: GitHub Pages, Cloudflare Pages, Netlify, S3, …
//
// GitHub Pages base-path support
// ------------------------------
// Project page (https://<user>.github.io/<repo>/) — build with:
//   VITE_BASE_PATH=/<repo>/ bun run build
// User/org root, apex domain, or custom (sub)domain — leave VITE_BASE_PATH
// unset so the base resolves to "/".
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  vite: {
    base,
    plugins: [
      {
        // The TanStack Start prerender plugin (used by SPA mode) imports
        // dist/server/server.js, but the Lovable Cloudflare adapter emits
        // dist/server/index.js. Mirror it so prerender can boot the SSR
        // bundle and produce the static client shell.
        name: "lovable:alias-server-entry",
        apply: "build",
        enforce: "post",
        closeBundle() {
          const dir = resolve(process.cwd(), "dist", "server");
          const src = resolve(dir, "index.js");
          const dst = resolve(dir, "server.js");
          if (existsSync(src) && !existsSync(dst)) {
            copyFileSync(src, dst);
          }
        },
      },
    ],
  },
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        enabled: true,
        outputPath: "/_shell",
        crawlLinks: false,
        retryCount: 0,
      },
    },
  },
});
