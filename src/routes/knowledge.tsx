import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KB_CATEGORIES,
  searchKB,
  type Assignment,
  type Category,
  type Difficulty,
  type QA,
  type Topic,
} from "@/lib/knowledge";
import { useMergedCategories } from "@/lib/kb-overrides";
import { CodeBlock } from "@/components/CodeBlock";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { DiagramSwitcher } from "@/components/DiagramSwitcher";

const BOOKMARK_KEY = "kb:bookmarks:v1";
const FEEDBACK_KEY = "kb:feedback:v1";

const ASSIGNMENT_OPTIONS: Assignment[] = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "Book1",
  "Book2",
  "Book3",
  "Book4",
  "Book6",
];

const SOURCE_LABELS: Record<Assignment, string> = {
  P1: "Assignment P1",
  P2: "Assignment P2",
  P3: "Assignment P3",
  P4: "Assignment P4",
  P5: "Assignment P5",
  Book1: "Rao — Engineering Optimization",
  Book2: "Iqbal — Fundamental Eng. Optimization",
  Book3: "Parkinson et al. — Optimization Methods for Eng. Design",
  Book4: "Nocedal & Wright — Numerical Optimization",
  Book6: "Bonnans et al. — Numerical Optimization (T&P)",
};

/** Short labels used in inline citation chips below each answer. */
const SOURCE_SHORT: Record<Assignment, string> = {
  P1: "P1",
  P2: "P2",
  P3: "P3",
  P4: "P4",
  P5: "P5",
  Book1: "Rao",
  Book2: "Iqbal",
  Book3: "Parkinson",
  Book4: "Nocedal & Wright",
  Book6: "Bonnans et al.",
};
const DIFFICULTY_OPTIONS: Difficulty[] = ["intro", "intermediate", "advanced"];

/** Current export schema version. Bump when the on-disk shape changes. */
const BOOKMARK_EXPORT_VERSION = 2 as const;

type ParseResult =
  | { ok: true; ids: string[]; version: number; migrated: boolean }
  | { ok: false; error: string };

/**
 * Validate a bookmark export file and migrate older formats forward.
 *
 * Supported shapes:
 *  - v1: { kind: "wgbiba-kb-bookmarks", version: 1, bookmarks: string[] }
 *  - v2: same as v1 but with explicit `exportedAt`. New `version: 2`.
 *  - legacy: a bare JSON array of ids (very early dev exports).
 */
function parseBookmarkExport(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }

  // Legacy: bare array of strings.
  if (Array.isArray(json)) {
    const ids = json.filter((x): x is string => typeof x === "string");
    if (ids.length !== json.length) {
      return {
        ok: false,
        error: `Legacy array contained ${json.length - ids.length} non-string entries.`,
      };
    }
    return { ok: true, ids, version: 0, migrated: true };
  }

  if (!json || typeof json !== "object") {
    return { ok: false, error: "Expected a JSON object or array of bookmark ids." };
  }

  const obj = json as Record<string, unknown>;

  if (obj.kind !== undefined && obj.kind !== "wgbiba-kb-bookmarks") {
    return {
      ok: false,
      error: `Unknown export kind: "${String(obj.kind)}". Expected "wgbiba-kb-bookmarks".`,
    };
  }

  const version = typeof obj.version === "number" ? obj.version : NaN;
  if (!Number.isFinite(version) || version < 1) {
    return {
      ok: false,
      error: `Missing or invalid "version" field (got ${JSON.stringify(obj.version)}).`,
    };
  }
  if (version > BOOKMARK_EXPORT_VERSION) {
    return {
      ok: false,
      error: `File was created with a newer schema (v${version}). This build understands up to v${BOOKMARK_EXPORT_VERSION}.`,
    };
  }

  if (!Array.isArray(obj.bookmarks)) {
    return { ok: false, error: '"bookmarks" must be an array of strings.' };
  }
  const bad = obj.bookmarks.findIndex((x) => typeof x !== "string");
  if (bad >= 0) {
    return {
      ok: false,
      error: `bookmarks[${bad}] is not a string (got ${typeof obj.bookmarks[bad]}).`,
    };
  }
  const ids = obj.bookmarks as string[];

  // Validate id shape: "category/topic/qa".
  const malformed = ids.findIndex((id) => id.split("/").length !== 3);
  if (malformed >= 0) {
    return {
      ok: false,
      error: `bookmarks[${malformed}] = "${ids[malformed]}" is not a valid id (expected "category/topic/question").`,
    };
  }

  return {
    ok: true,
    ids,
    version,
    migrated: version < BOOKMARK_EXPORT_VERSION,
  };
}

type SearchSchema = {
  cat?: string;
  topic?: string;
  q?: string;
  /** Facet: assignment */
  a?: Assignment;
  /** Facet: difficulty */
  d?: Difficulty;
  /** Facet: category — used when searching, distinct from active reading category */
  fc?: string;
};

function isAssignment(v: unknown): v is Assignment {
  return typeof v === "string" && (ASSIGNMENT_OPTIONS as string[]).includes(v);
}
function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTY_OPTIONS as string[]).includes(v);
}

export const Route = createFileRoute("/knowledge")({
  validateSearch: (search: Record<string, unknown>): SearchSchema => ({
    cat: typeof search.cat === "string" ? search.cat : undefined,
    topic: typeof search.topic === "string" ? search.topic : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    a: isAssignment(search.a) ? search.a : undefined,
    d: isDifficulty(search.d) ? search.d : undefined,
    fc: typeof search.fc === "string" ? search.fc : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Knowledge Base — Optimization for Engineers | WGBIBA" },
      {
        name: "description",
        content:
          "Interactive engineering knowledge base on optimization: linear programming, integer programming, branch-and-bound, dynamic programming, heuristics and metaheuristics — Q&A, runnable Python, and switchable diagrams.",
      },
      { property: "og:title", content: "Knowledge Base — Optimization for Engineers" },
      {
        property: "og:description",
        content:
          "Q&A, runnable in-browser Python, switchable diagrams, filters by topic and difficulty.",
      },
    ],
  }),
  component: KnowledgePage,
});

function useLocalStorageSet(key: string) {
  const [set, setSet] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSet(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, [key]);
  const persist = (next: Set<string>) => {
    setSet(new Set(next));
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
    } catch {
      /* ignore */
    }
  };
  return {
    has: (id: string) => set.has(id),
    toggle: (id: string) => {
      const n = new Set(set);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      persist(n);
    },
    replaceAll: (ids: string[]) => persist(new Set(ids)),
    merge: (ids: string[]) => persist(new Set([...Array.from(set), ...ids])),
    all: set,
  };
}

function useLocalStorageMap(key: string) {
  const [map, setMap] = useState<Record<string, "up" | "down">>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setMap(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [key]);
  const set = (id: string, v: "up" | "down" | undefined) => {
    setMap((prev) => {
      const n = { ...prev };
      if (v) n[id] = v;
      else delete n[id];
      try {
        localStorage.setItem(key, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  };
  return { map, set };
}

function KnowledgePage() {
  const { cat, topic, q, a, d, fc } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [query, setQuery] = useState(q ?? "");
  useEffect(() => setQuery(q ?? ""), [q]);

  // Merge built-in KB with the user's local edits/adds/deletes from the
  // dashboard editor. Falls back to the built-in tree on first SSR pass.
  const mergedCategories = useMergedCategories();
  const categories: Category[] =
    mergedCategories.length > 0 ? mergedCategories : KB_CATEGORIES;

  const activeCategory: Category =
    categories.find((c) => c.id === cat) ?? categories[0];
  const activeTopic: Topic =
    activeCategory.topics.find((t) => t.id === topic) ?? activeCategory.topics[0];

  const bookmarks = useLocalStorageSet(BOOKMARK_KEY);
  const feedback = useLocalStorageMap(FEEDBACK_KEY);

  const facets = useMemo(
    () => ({
      categoryId: fc || undefined,
      assignment: a,
      difficulty: d,
    }),
    [fc, a, d],
  );
  const hasFacet = !!(facets.categoryId || facets.assignment || facets.difficulty);
  const searchResults = useMemo(
    () => (q || hasFacet ? searchKB(q ?? "", facets, categories) : []),
    [q, facets, hasFacet, categories],
  );

  const submitSearch = (value: string) => {
    navigate({
      search: (prev: SearchSchema) => ({ ...prev, q: value || undefined }),
      replace: true,
    });
  };

  const setFacet = (patch: Partial<SearchSchema>) => {
    navigate({ search: (prev: SearchSchema) => ({ ...prev, ...patch }), replace: true });
  };

  const clearFilters = () => {
    navigate({
      search: (prev: SearchSchema) => ({
        ...prev,
        q: undefined,
        a: undefined,
        d: undefined,
        fc: undefined,
      }),
      replace: true,
    });
    setQuery("");
  };

  // Bookmarks list
  const allBookmarkedQAs = useMemo(() => {
    const out: Array<{ category: Category; topic: Topic; qa: QA }> = [];
    for (const c of categories) {
      for (const t of c.topics) {
        for (const qa of t.qa) {
          const id = `${c.id}/${t.id}/${qa.id}`;
          if (bookmarks.has(id)) out.push({ category: c, topic: t, qa });
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks.all, categories]);

  // ----- bookmark export/import -----
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{
    kind: "ok" | "error" | "warn";
    text: string;
  } | null>(null);

  const exportBookmarks = () => {
    const payload = {
      kind: "wgbiba-kb-bookmarks",
      version: BOOKMARK_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      bookmarks: Array.from(bookmarks.all),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kb-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // All known QA ids — used to warn the user about bookmarks that no longer
  // resolve to a question (e.g. the curriculum changed since the export).
  const knownIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of categories)
      for (const t of c.topics) for (const qa of t.qa) s.add(`${c.id}/${t.id}/${qa.id}`);
    return s;
  }, [categories]);

  const importBookmarks = async (file: File, mode: "merge" | "replace") => {
    setImportMsg(null);
    try {
      const text = await file.text();
      const result = parseBookmarkExport(text);
      if (!result.ok) {
        setImportMsg({ kind: "error", text: result.error });
        return;
      }
      const { ids, version, migrated } = result;
      const known = ids.filter((id) => knownIds.has(id));
      const unknown = ids.length - known.length;
      if (mode === "replace") bookmarks.replaceAll(known);
      else bookmarks.merge(known);

      const parts: string[] = [];
      parts.push(`Imported ${known.length} bookmark${known.length === 1 ? "" : "s"} (${mode}).`);
      if (migrated) parts.push(`Migrated from v${version} → v${BOOKMARK_EXPORT_VERSION}.`);
      if (unknown > 0)
        parts.push(
          `${unknown} entr${unknown === 1 ? "y was" : "ies were"} skipped (no longer in the curriculum).`,
        );
      setImportMsg({ kind: unknown > 0 ? "warn" : "ok", text: parts.join(" ") });
    } catch (e) {
      setImportMsg({
        kind: "error",
        text: `Couldn't read the file: ${(e as Error).message}`,
      });
    }
  };

  return (
    <div className="kb-shell">
      {/* Top header */}
      <header className="kb-header">
        <div className="container kb-header-inner">
          <Link to="/" search={{ view: "full" }} className="kb-brand">
            <span className="brand-mark">WG</span>
            <span>WGBIBA · Knowledge Base</span>
          </Link>

          <div className="kb-search">
            <span className="kb-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch(query);
              }}
              onBlur={() => submitSearch(query)}
              placeholder="Search topics, questions, code…"
              aria-label="Search knowledge base"
              className="kb-search-input"
            />
            {query && (
              <button
                className="kb-search-clear"
                onClick={() => {
                  setQuery("");
                  submitSearch("");
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <Link
            to="/"
            search={{ view: "full" }}
            className="kb-back"
            aria-label="Back to main site"
          >
            ← Main site
          </Link>
        </div>

        {/* Filter bar */}
        <div className="container kb-filterbar">
          <span className="kb-filter-label">Filter:</span>

          <select
            aria-label="Category"
            className="kb-filter-select"
            value={fc ?? ""}
            onChange={(e) => setFacet({ fc: e.target.value || undefined })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Assignment"
            className="kb-filter-select"
            value={a ?? ""}
            onChange={(e) =>
              setFacet({ a: e.target.value ? (e.target.value as Assignment) : undefined })
            }
          >
            <option value="">All sources</option>
            {ASSIGNMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {SOURCE_LABELS[opt]}
              </option>
            ))}
          </select>

          <select
            aria-label="Difficulty"
            className="kb-filter-select"
            value={d ?? ""}
            onChange={(e) =>
              setFacet({ d: e.target.value ? (e.target.value as Difficulty) : undefined })
            }
          >
            <option value="">Any difficulty</option>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt[0].toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>

          {(q || hasFacet) && (
            <button className="kb-filter-clear" onClick={clearFilters}>
              Clear
            </button>
          )}

          <span className="kb-filter-spacer" />

          <Link to="/knowledge-feedback" className="kb-filter-link">
            My feedback →
          </Link>
        </div>
      </header>

      <div className="container kb-main">
        {/* Sidebar */}
        <aside className="kb-sidebar">
          <nav aria-label="Topic categories">
            {categories.map((c) => (
              <div key={c.id} className="kb-cat">
                <Link
                  to="/knowledge"
                  search={{ cat: c.id, topic: c.topics[0].id }}
                  className={`kb-cat-head ${c.id === activeCategory.id ? "active" : ""}`}
                >
                  <span className="kb-cat-icon">{c.icon}</span>
                  <span>{c.title}</span>
                </Link>
                {c.id === activeCategory.id && (
                  <ul className="kb-topic-list">
                    {c.topics.map((t) => (
                      <li key={t.id}>
                        <Link
                          to="/knowledge"
                          search={{ cat: c.id, topic: t.id }}
                          className={`kb-topic-link ${
                            t.id === activeTopic.id ? "active" : ""
                          }`}
                        >
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>

          <div className="kb-bookmarks">
            <h4>★ Saved questions ({allBookmarkedQAs.length})</h4>
            {allBookmarkedQAs.length === 0 ? (
              <p className="kb-bookmarks-empty">
                Bookmark questions with the ☆ button to find them again later.
              </p>
            ) : (
              <ul>
                {allBookmarkedQAs.slice(0, 6).map(({ category, topic: t, qa }) => (
                  <li key={`${category.id}/${t.id}/${qa.id}`}>
                    <Link
                      to="/knowledge"
                      search={{ cat: category.id, topic: t.id }}
                      hash={qa.id}
                    >
                      {qa.question}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="kb-bookmarks-actions">
              <button
                type="button"
                className="kb-link-btn"
                onClick={exportBookmarks}
                disabled={allBookmarkedQAs.length === 0}
              >
                Export
              </button>
              <button
                type="button"
                className="kb-link-btn"
                onClick={() => fileRef.current?.click()}
              >
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const mode = window.confirm(
                    "OK = MERGE with your existing bookmarks.\nCancel = REPLACE them.",
                  )
                    ? "merge"
                    : "replace";
                  importBookmarks(f, mode);
                  e.target.value = "";
                }}
              />
            </div>
            {importMsg && (
              <div className={`kb-import-msg kb-import-${importMsg.kind}`} role="status">
                <span>{importMsg.text}</span>
                <button
                  type="button"
                  className="kb-import-dismiss"
                  aria-label="Dismiss message"
                  onClick={() => setImportMsg(null)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Content area */}
        <main className="kb-content">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="kb-crumbs">
            <Link to="/" search={{ view: "full" }}>
              Home
            </Link>
            <span aria-hidden>›</span>
            <Link to="/knowledge" search={{}}>
              Knowledge
            </Link>
            <span aria-hidden>›</span>
            <Link
              to="/knowledge"
              search={{ cat: activeCategory.id, topic: activeCategory.topics[0].id }}
            >
              {activeCategory.title}
            </Link>
            <span aria-hidden>›</span>
            <span aria-current="page">{activeTopic.title}</span>
          </nav>

          {/* Search results take precedence when there's a query OR an active facet */}
          {(q || hasFacet) && searchResults.length > 0 && (
            <section className="kb-search-results">
              <h2>
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
                {q ? <> for "{q}"</> : null}
                {hasFacet ? " (filtered)" : null}
              </h2>
              <ul>
                {searchResults.map((r) => (
                  <li key={`${r.categoryId}/${r.topicId}/${r.qaId}`}>
                    <Link
                      to="/knowledge"
                      search={{ cat: r.categoryId, topic: r.topicId }}
                      hash={r.qaId}
                    >
                      <strong>{r.question}</strong>
                    </Link>
                    <div className="kb-result-meta">
                      {r.categoryTitle} › {r.topicTitle}
                      {r.assignments.length > 0 && (
                        <>
                          {" · "}
                          {r.assignments.map((x) => (
                            <span key={x} className="kb-tag">
                              {x === "Book2" ? "Reference" : x}
                            </span>
                          ))}
                        </>
                      )}
                      {r.difficulty && (
                        <span className={`kb-tag kb-tag-${r.difficulty}`}>{r.difficulty}</span>
                      )}
                    </div>
                    <div className="kb-result-snippet">{r.snippet}…</div>
                  </li>
                ))}
              </ul>
              <button className="btn btn-outline" onClick={clearFilters}>
                Clear search & filters
              </button>
            </section>
          )}

          {(q || hasFacet) && searchResults.length === 0 && (
            <section className="kb-search-results kb-no-results" aria-live="polite">
              <div className="kb-no-results-icon" aria-hidden>
                ⌕
              </div>
              <h2>No matching questions</h2>
              <p className="kb-no-results-sub">
                Nothing matched your current search and filters. Try removing one of the
                active filters below, or clear them all.
              </p>
              <ul className="kb-active-filters" aria-label="Active filters">
                {q && (
                  <li>
                    <span className="kb-chip">
                      <span className="kb-chip-key">Search</span>
                      <span className="kb-chip-val">"{q}"</span>
                      <button
                        type="button"
                        aria-label={`Remove search "${q}"`}
                        onClick={() => {
                          setQuery("");
                          submitSearch("");
                        }}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                )}
                {fc && (
                  <li>
                    <span className="kb-chip">
                      <span className="kb-chip-key">Category</span>
                      <span className="kb-chip-val">
                        {categories.find((c) => c.id === fc)?.title ?? fc}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove category filter"
                        onClick={() => setFacet({ fc: undefined })}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                )}
                {a && (
                  <li>
                    <span className="kb-chip">
                      <span className="kb-chip-key">Source</span>
                      <span className="kb-chip-val">{a === "Book2" ? "Reference" : a}</span>
                      <button
                        type="button"
                        aria-label="Remove source filter"
                        onClick={() => setFacet({ a: undefined })}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                )}
                {d && (
                  <li>
                    <span className="kb-chip">
                      <span className="kb-chip-key">Difficulty</span>
                      <span className="kb-chip-val">{d}</span>
                      <button
                        type="button"
                        aria-label="Remove difficulty filter"
                        onClick={() => setFacet({ d: undefined })}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                )}
              </ul>
              <button className="btn btn-outline" onClick={clearFilters}>
                Reset all filters
              </button>
            </section>
          )}

          {/* Topic */}
          {!q && !hasFacet && (
            <article>
              <header className="kb-topic-head">
                <div className="kb-eyebrow">
                  {activeCategory.title}
                  {activeTopic.assignments && activeTopic.assignments.length > 0 && (
                    <>
                      {" · "}
                      {activeTopic.assignments.map((x) => (
                        <span key={x} className="kb-tag">
                          {x === "Book2" ? "Reference" : x}
                        </span>
                      ))}
                    </>
                  )}
                  {activeTopic.difficulty && (
                    <span className={`kb-tag kb-tag-${activeTopic.difficulty}`}>
                      {activeTopic.difficulty}
                    </span>
                  )}
                </div>
                <h1>{activeTopic.title}</h1>
                <p className="kb-intro">{activeTopic.intro}</p>
              </header>

              <ol className="kb-qa-list">
                {activeTopic.qa.map((qa, idx) => {
                  const fullId = `${activeCategory.id}/${activeTopic.id}/${qa.id}`;
                  const fb = feedback.map[fullId];
                  return (
                    <li key={qa.id} id={qa.id} className="kb-qa">
                      <details open={idx < 2}>
                        <summary>
                          <span className="kb-qa-num">Q{idx + 1}</span>
                          <span className="kb-qa-question">{qa.question}</span>
                          <button
                            type="button"
                            className={`kb-bookmark ${
                              bookmarks.has(fullId) ? "active" : ""
                            }`}
                            aria-pressed={bookmarks.has(fullId)}
                            aria-label={
                              bookmarks.has(fullId) ? "Remove bookmark" : "Bookmark question"
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              bookmarks.toggle(fullId);
                            }}
                          >
                            {bookmarks.has(fullId) ? "★" : "☆"}
                          </button>
                        </summary>

                        <div className="kb-qa-body">
                          <div
                            className="kb-answer"
                            dangerouslySetInnerHTML={{ __html: qa.answer }}
                          />

                          {qa.math && qa.math.length > 0 && (
                            <pre className="kb-math">{qa.math.join("\n")}</pre>
                          )}

                          {qa.code && (
                            <CodeBlock
                              source={qa.code.source}
                              language={qa.code.language}
                              title={qa.code.title}
                            />
                          )}

                          {qa.diagrams ? (
                            <DiagramSwitcher
                              title={qa.diagrams.title}
                              variants={qa.diagrams.variants}
                            />
                          ) : qa.diagram ? (
                            <MermaidDiagram code={qa.diagram.mermaid} title={qa.diagram.title} />
                          ) : null}

                          {qa.citations && qa.citations.length > 0 && (
                            <aside
                              className="kb-citations"
                              aria-label="Inline references for this answer"
                            >
                              <span className="kb-citations-label">Sources</span>
                              <ul>
                                {qa.citations.map((c, idx) => (
                                  <li
                                    key={`${c.source}-${c.locator}-${idx}`}
                                    className="kb-citation"
                                    title={SOURCE_LABELS[c.source]}
                                  >
                                    <span className="kb-citation-src">
                                      {SOURCE_SHORT[c.source]}
                                    </span>
                                    <span className="kb-citation-loc">{c.locator}</span>
                                    {c.note && (
                                      <span className="kb-citation-note">— {c.note}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </aside>
                          )}

                          {qa.deepDive && (
                            <aside className="kb-deepdive">
                              <h4>Deep dive — reference texts</h4>
                              <p>{qa.deepDive}</p>
                            </aside>
                          )}

                          <footer className="kb-qa-foot">
                            <span className="kb-qa-foot-label">Was this helpful?</span>
                            <button
                              className={`kb-fb ${fb === "up" ? "active" : ""}`}
                              onClick={() =>
                                feedback.set(fullId, fb === "up" ? undefined : "up")
                              }
                              aria-label="Mark answer as helpful"
                            >
                              👍
                            </button>
                            <button
                              className={`kb-fb ${fb === "down" ? "active" : ""}`}
                              onClick={() =>
                                feedback.set(fullId, fb === "down" ? undefined : "down")
                              }
                              aria-label="Mark answer as not helpful"
                            >
                              👎
                            </button>
                            <a className="kb-anchor" href={`#${qa.id}`}>
                              # link
                            </a>
                          </footer>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ol>

              {/* Topic-level pager */}
              <nav className="kb-pager" aria-label="Topic pagination">
                {prevTopic(activeCategory, activeTopic) && (
                  <Link
                    to="/knowledge"
                    search={{
                      cat: activeCategory.id,
                      topic: prevTopic(activeCategory, activeTopic)!.id,
                    }}
                    className="kb-pager-link"
                  >
                    ← {prevTopic(activeCategory, activeTopic)!.title}
                  </Link>
                )}
                {nextTopic(activeCategory, activeTopic) && (
                  <Link
                    to="/knowledge"
                    search={{
                      cat: activeCategory.id,
                      topic: nextTopic(activeCategory, activeTopic)!.id,
                    }}
                    className="kb-pager-link kb-pager-next"
                  >
                    {nextTopic(activeCategory, activeTopic)!.title} →
                  </Link>
                )}
              </nav>
            </article>
          )}
        </main>
      </div>

      <section className="kb-cta-banner" aria-labelledby="kb-cta-title">
        <div className="container kb-cta-inner">
          <div className="kb-cta-text">
            <h2 id="kb-cta-title">Want the full story on Optimization Methods?</h2>
            <p>
              Read our long-form article — a single guided reading from problem
              formulation through linear, nonlinear, integer, and metaheuristic
              methods, with sources and citations from the textbooks and recent
              peer-reviewed surveys.
            </p>
          </div>
          <Link to="/optimization-methods" className="kb-cta-button">
            Open the article →
          </Link>
        </div>
      </section>

      <footer className="kb-footer">
        <div className="container">
          <p className="muted small">
            Curriculum compiled from five course assignments on optimization, with
            supplementary depth from Rao's <em>Engineering Optimization: Theory and
            Practice</em>.
          </p>
        </div>
      </footer>
    </div>
  );
}

function prevTopic(c: Category, t: Topic): Topic | null {
  const i = c.topics.findIndex((x) => x.id === t.id);
  return i > 0 ? c.topics[i - 1] : null;
}
function nextTopic(c: Category, t: Topic): Topic | null {
  const i = c.topics.findIndex((x) => x.id === t.id);
  return i >= 0 && i < c.topics.length - 1 ? c.topics[i + 1] : null;
}
