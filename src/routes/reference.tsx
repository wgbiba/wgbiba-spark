import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Static page that displays the bundled reference extract used to ground the
 * chatbot. Each section gets an id (sec-X-Y) so [§X.Y] citations from the
 * chatbot can deep-link straight to the matching snippet.
 */

const REFERENCE_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const REFERENCE_DATA_URL = `${REFERENCE_BASE}/data/reference.md`;

type Section = { head: string; slug: string; body: string };

function slugForHead(head: string): string {
  const numMatch = head.match(/^(\d+(?:\.\d+){0,3})/);
  if (numMatch) return `sec-${numMatch[1].replace(/\./g, "-")}`;
  return `sec-${head.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function parseReference(md: string): Section[] {
  const out: Section[] = [];
  const blocks = md.split(/\n(?=## )/);
  for (const block of blocks) {
    const m = block.match(/^##\s+(.+)\n([\s\S]*)$/);
    if (!m) continue;
    const head = m[1].trim();
    const body = m[2].trim();
    if (!body) continue;
    out.push({ head, slug: slugForHead(head), body });
  }
  return out;
}

export const Route = createFileRoute("/reference")({
  component: ReferencePage,
  head: () => ({
    meta: [
      { title: "Reference Extract — WGBIBA" },
      {
        name: "description",
        content:
          "Compact extract of the engineering optimization reference text used to ground the WGBIBA assistant.",
      },
    ],
  }),
});

function ReferencePage() {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(REFERENCE_DATA_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load reference (${res.status})`);
        const text = await res.text();
        setSections(parseReference(text));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  // After the data renders, scroll to the URL hash if any.
  useEffect(() => {
    if (!sections) return;
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [sections]);

  return (
    <main className="container" style={{ padding: "32px 0", maxWidth: 820 }}>
      <p style={{ marginBottom: 8 }}>
        <Link to="/" search={{ view: "full" }} className="kb-link-btn">
          ← Back to site
        </Link>
      </p>
      <h1>Reference Extract</h1>
      <p className="muted">
        Compact section snippets used by the optimization assistant to ground its answers.
        Citations like <code>[§4.3]</code> in chat link directly here.
      </p>

      {error && <p className="kb-chat-error">{error}</p>}
      {!sections && !error && <p className="muted">Loading reference…</p>}

      {sections && (
        <nav aria-label="Sections" style={{ margin: "20px 0", fontSize: "0.88rem" }}>
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Table of contents ({sections.length} sections)
            </summary>
            <ul style={{ columns: 2, marginTop: 8 }}>
              {sections.map((s) => (
                <li key={s.slug}>
                  <a href={`#${s.slug}`}>§{s.head}</a>
                </li>
              ))}
            </ul>
          </details>
        </nav>
      )}

      {sections?.map((s) => (
        <section
          id={s.slug}
          key={s.slug}
          style={{
            padding: "16px 18px",
            margin: "14px 0",
            border: "1px solid var(--c-border)",
            borderRadius: 10,
            background: "#fff",
            scrollMarginTop: 80,
          }}
        >
          <h2 style={{ fontSize: "1.05rem", margin: "0 0 8px 0" }}>§{s.head}</h2>
          <p style={{ margin: 0, lineHeight: 1.55 }}>{s.body}</p>
        </section>
      ))}
    </main>
  );
}
