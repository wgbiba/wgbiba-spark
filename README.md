# WGBIBA — Business Informatics & Analytics

Static single-page website for the **WGBIBA** group at Brandenburg University
of Technology Cottbus–Senftenberg.

- ⚡ **Pure static** — ships as plain HTML/CSS/JS, no backend required
- 🌍 **Multilingual** — English, Deutsch, 中文, فارسی (with RTL support)
- 📦 **Data-driven** — content lives in three JSON files under `public/data/`
- 🛠 **Pseudo-admin dashboard** at `/dashboard` for generating new entries
- 🔍 **Hidden `/debug` route** for verifying deployment (base path, JSON GETs,
  router fallback)
- 📄 **Free to fork & reuse** under the MIT license

---

## Table of contents

1. [Quick start](#quick-start)
2. [Updating site content (the JSON files)](#updating-site-content-the-json-files)
3. [Forking this site for another group](#forking-this-site-for-another-group)
4. [Deploying to GitHub Pages](#deploying-to-github-pages)
5. [Project structure](#project-structure)
6. [Adding or changing translations](#adding-or-changing-translations)
7. [Hidden debug page](#hidden-debug-page)
8. [License](#license)

---

## Quick start

Requirements: [Bun](https://bun.sh) ≥ 1.1 (or Node 20+ with `npm`).

```bash
# install dependencies
bun install

# start the dev server (http://localhost:5173)
bun run dev

# production build (outputs to dist/)
bun run build

# preview the production build locally
bun run preview
```

---

## Updating site content (the JSON files)

All visible content (tasks, projects, research items) is loaded at runtime
from three JSON arrays in `public/data/`:

```
public/data/
├── tasks.json        # course tasks & assignments
├── projects.json     # software projects / tools
└── research.json     # papers, technical reports, repositories
```

You have **two equivalent ways** to edit them.

### Option A — Edit JSON directly on GitHub (easiest)

1. Open the repository on GitHub.
2. Browse to `public/data/tasks.json` (or `projects.json` / `research.json`).
3. Click the pencil icon (**Edit this file**).
4. Add/edit an entry following the schema below.
5. Click **Commit changes**.
6. GitHub Pages will redeploy automatically (≈ 1 minute).

### Option B — Use the in-app dashboard

The site includes a **Pseudo-Admin Content Dashboard** at `/dashboard`
(linked from the navbar) that generates valid JSON for you:

1. Visit `/dashboard` on the live site or in dev (`bun run dev`).
2. Pick the **Add Task** or **Add Project** tab.
3. Fill in the form — a live card preview renders on the right.
4. Click **Generate JSON**, then **Copy**.
5. Paste the snippet into the corresponding JSON array on GitHub.

> Nothing is stored on a server. The dashboard is a JSON authoring helper.

### JSON schemas

**Task** (`public/data/tasks.json`):
```jsonc
{
  "title": "First Assignment – Optimization Basics",
  "description": "Short summary of what the task covers.",
  "tag": "Optimization",        // used by the on-site filter
  "date": "2025-04-15",         // ISO date
  "links": [
    { "label": "Task PDF", "url": "https://..." },
    { "label": "Solution", "url": "https://github.com/..." }
  ]
}
```

**Project** (`public/data/projects.json`):
```jsonc
{
  "title": "Optimization Toolkit",
  "description": "Reusable MILP modelling helpers.",
  "stack": ["Python", "Pyomo", "FastAPI"],
  "github": "https://github.com/wgbiba/optimization-toolkit",
  "demo": "https://..."          // optional
}
```

**Research** (`public/data/research.json`):
```jsonc
{
  "title": "On Robust Decision Analytics",
  "abstract": "One-paragraph abstract.",
  "type": "Paper",                // Paper | Report | Repository | Talk
  "year": "2025",
  "link": "https://doi.org/..."
}
```

> Each file is a JSON **array**. The site fetches them with
> `useDataset()` and shows a friendly retry-able error if the file is missing
> or malformed (see `/debug` for a live diagnostic).

---

## Forking this site for another group

This project is intentionally **branding-light** so any university group,
research lab or department can take it as a starting point.

### 1. Fork on GitHub

Click **Fork** at the top of the repo, then clone your fork:

```bash
git clone https://github.com/<your-account>/<your-repo>.git
cd <your-repo>
bun install
```

### 2. Replace the brand & contact details

Search-and-replace these strings across the codebase:

| Old value                         | What to put instead                  |
|-----------------------------------|--------------------------------------|
| `WGBIBA`                          | Your group's short name              |
| `Business Informatics & Analytics`| Your group's long name               |
| `BTU Cottbus–Senftenberg`         | Your university                      |
| `wgbiba.dept@gmail.com`           | Your contact email                   |
| `https://github.com/wgbiba`       | Your GitHub org / user URL           |
| `Konrad-Wachsmann-Allee, 03046 Cottbus, Germany` | Your address |

The strings live in:
- `src/lib/i18n.ts` (all UI text, in 4 languages)
- `src/routes/index.tsx` (hardcoded brand mark, address, mailto)
- `src/routes/__root.tsx` (HTML title, meta tags, Open Graph)
- `README.md` and `LICENSE`

### 3. Replace the content

Edit the three JSON files in `public/data/` to put your own tasks, projects
and research items in. Empty arrays (`[]`) are fine — the site will display a
friendly empty state.

### 4. Update the favicon / hero image

- Drop a `favicon.ico` (or `.svg`) into `public/` to override the default.
- The hero background image URL lives in `src/styles.css` (`.hero { background: ... }`)
  and `src/routes/index.tsx` (`HERO_IMAGE` constant for Open Graph).

### 5. Rename the package (optional)

Edit `package.json` → `"name"` to your repo name.

### 6. Deploy

See the next section.

---

## Deploying to GitHub Pages

The site is a fully static SPA — any static host works. The recommended path
is **GitHub Pages**:

### A. Project page (`https://<user>.github.io/<repo>/`)

The site must be built with the repo name as base path:

```bash
VITE_BASE_PATH=/<repo>/ bun run build
```

Then:

- **(Recommended) Use the included GitHub Action** — `.github/workflows/deploy.yml`
  is already in this repo. On every push to `main` it builds with
  `VITE_BASE_PATH=/<repo>/` and publishes the static output via the official
  GitHub Pages action. In your fork's repo settings:
  **Settings → Pages → Build and deployment → Source: `GitHub Actions`**.
  No `gh-pages` branch is needed.
- **Or manually**: run `VITE_BASE_PATH=/<repo>/ bun run build`, then
  `cp dist/client/_shell.html dist/client/index.html` and publish
  `dist/client/` to your host.

### B. User / organization site (`https://<user>.github.io/`)

```bash
bun run build
cp dist/client/_shell.html dist/client/index.html
```

Then publish `dist/client/` to the root of `<user>.github.io`.

### C. Custom domain or any other static host

Build with `bun run build`, upload `dist/` to your host of choice
(Cloudflare Pages, Netlify, S3+CloudFront, Vercel, …).

> **Why a base path?** GitHub project pages are served from a subdirectory
> (`/<repo>/`). The app honours `VITE_BASE_PATH` for both router navigation
> and JSON fetches via the `assetUrl()` / `internalHref()` helpers in
> `src/lib/data.ts`. Visit `/debug` after deploying to verify everything
> resolves correctly.

### SPA fallback

GitHub Pages does not natively support client-side routing. The included
`public/404.html` captures the deep-link path into `sessionStorage`,
redirects to the app shell, and `src/components/SpaRedirectHandler.tsx`
restores the URL on boot. Deep links like `/<repo>/dashboard` and refreshes
work out of the box.

---

## Project structure

```
.
├── public/
│   ├── 404.html             # GitHub Pages SPA fallback
│   └── data/
│       ├── tasks.json
│       ├── projects.json
│       └── research.json
├── src/
│   ├── components/
│   │   ├── DataStatusWidget.tsx   # floating fetch-status panel
│   │   └── SpaRedirectHandler.tsx
│   ├── lib/
│   │   ├── data.ts          # useDataset, assetUrl, basePath, internalHref
│   │   └── i18n.ts          # EN / DE / ZH / FA dictionaries + hook
│   ├── routes/
│   │   ├── __root.tsx       # html shell, head meta, NotFound
│   │   ├── index.tsx        # landing page
│   │   ├── dashboard.tsx    # pseudo-admin JSON generator
│   │   └── debug.tsx        # hidden diagnostic page (/debug)
│   ├── router.tsx
│   └── styles.css           # full design system (no Tailwind utilities used in pages)
├── vite.config.ts
├── package.json
├── LICENSE
└── README.md
```

---

## Adding or changing translations

All UI strings live in **`src/lib/i18n.ts`**. Each supported language has a
strongly-typed `Dict` object:

```ts
const en: Dict = { /* … */ };
const de: Dict = { /* … */ };
const zh: Dict = { /* … */ };
const fa: Dict = { /* … */ };
```

To **add a language**:

1. Add its code to the `Lang` union and to the `LANGS` array
   (`{ code, label, native }`).
2. If it is right-to-left, add it to `RTL_LANGS`.
3. Copy the `en` dictionary, translate every string, and register it in
   the `DICTS` map.

Language preference is detected from the browser on first visit, stored in
`localStorage` (`wgbiba.lang`), and applied as `<html lang>` + `<html dir>`.

---

## Hidden debug page

Visit `/debug` (not linked anywhere on the site) for a deployment diagnostic
that shows:

- Resolved environment values (`BASE_URL`, `basePath()`, every `assetUrl(…)`)
- Base-path-aware quick links to Tasks, Projects and Dashboard
- A live router-fallback checklist that GETs `/index.html`, `/dashboard`,
  `/dashboard?tab=tasks` and reports pass / fail
- A live snapshot of the `sessionStorage` fetch-outcomes cache
- Per-feed cards for `tasks.json`, `projects.json`, `research.json` showing
  HTTP status, latency, item count, raw error, and a JSON preview

Marked `noindex, nofollow` so it never appears in search results.

---

## License

[MIT](./LICENSE) © WGBIBA Group — Brandenburg University of Technology
Cottbus–Senftenberg.

You are free to copy, fork and re-deploy this site for any purpose, including
commercial, as long as you keep the copyright notice in the `LICENSE` file.
