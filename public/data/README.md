# Site data

Three JSON arrays power the visible content of the site. They are fetched at
runtime by `src/lib/data.ts` (`useDataset()`).

| File              | Used in section          |
|-------------------|--------------------------|
| `tasks.json`      | Tasks & Assignments      |
| `projects.json`   | Projects & Tools         |
| `research.json`   | Research                 |

## Editing

You can edit these files in two ways:

1. **Directly on GitHub** — open the file, click ✏️, edit, commit. The site
   redeploys automatically.
2. **Via the in-app dashboard** — visit `/dashboard` on the live site, fill
   in the form, copy the generated JSON, paste it into the array.

See the project root [`README.md`](../../README.md#updating-site-content-the-json-files)
for full schemas and examples.

## Validating

Each file must be a **valid JSON array**. The `/debug` page on the live site
fetches each file and reports the exact HTTP status, latency, item count and
parse result — useful after a manual edit.
