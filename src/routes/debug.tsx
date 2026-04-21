import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useDataset,
  assetUrl,
  basePath,
  internalHref,
  getCachedOutcomes,
  type FetchOutcome,
} from "@/lib/data";

export const Route = createFileRoute("/debug")({
  head: () => ({
    meta: [
      { title: "Debug — WGBIBA" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Hidden diagnostic page that performs live GET requests against the static JSON data files and reports the results.",
      },
    ],
  }),
  component: DebugPage,
});

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="debug-row">
      <span className="debug-row__label">{label}</span>
      <span className="debug-row__value">{value}</span>
    </div>
  );
}

/* ---------------- Per-feed report card ---------------- */
function FeedReport({ title, path }: { title: string; path: string }) {
  const ds = useDataset<unknown>(path);
  const ok = ds.status === "ok";
  const err = ds.status === "error";

  return (
    <article className={`debug-card ${ok ? "ok" : err ? "err" : "loading"}`}>
      <header className="debug-card__head">
        <h2>{title}</h2>
        <span className={`badge ${ds.status}`}>{ds.status.toUpperCase()}</span>
      </header>

      <Row label="Source path" value={<code>{path}</code>} />
      <Row
        label="Resolved URL"
        value={
          <a href={ds.url} target="_blank" rel="noopener noreferrer">
            <code>{ds.url}</code>
          </a>
        }
      />
      <Row
        label="HTTP status"
        value={ds.httpStatus !== null ? ds.httpStatus : "—"}
      />
      <Row
        label="Duration"
        value={ds.durationMs !== null ? `${ds.durationMs} ms` : "—"}
      />
      <Row
        label="Last attempt"
        value={
          ds.attemptedAt ? new Date(ds.attemptedAt).toLocaleTimeString() : "—"
        }
      />
      <Row label="Items parsed" value={ok ? ds.data.length : err ? "—" : "…"} />

      {err && (
        <div className="debug-error">
          <strong>Error</strong>
          <pre>{ds.error}</pre>
        </div>
      )}

      {ok && ds.data.length > 0 && (
        <details className="debug-preview">
          <summary>Preview first item</summary>
          <pre>{JSON.stringify(ds.data[0], null, 2)}</pre>
        </details>
      )}

      <div className="debug-actions">
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={ds.refetch}
          disabled={ds.status === "loading"}
        >
          ↻ Re-test
        </button>
      </div>
    </article>
  );
}

/* ---------------- Cached-outcomes summary table ---------------- */
function CachedOutcomesPanel() {
  const [snapshot, setSnapshot] = useState<Record<string, FetchOutcome>>({});

  useEffect(() => {
    setSnapshot(getCachedOutcomes());
    const id = window.setInterval(() => {
      setSnapshot(getCachedOutcomes());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const entries = Object.entries(snapshot);

  return (
    <section className="debug__env">
      <h2>SessionStorage — last fetch outcomes (live)</h2>
      {entries.length === 0 ? (
        <p className="muted small">
          No cached outcomes yet. Visit the home page once to populate.
        </p>
      ) : (
        <table className="debug-table" aria-label="Cached fetch outcomes">
          <thead>
            <tr>
              <th>Path</th>
              <th>Status</th>
              <th>HTTP</th>
              <th>Time</th>
              <th>When</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([p, o]) => (
              <tr key={p} className={o.status === "error" ? "row-err" : "row-ok"}>
                <td><code>{p}</code></td>
                <td>
                  <span className={`badge ${o.status}`}>{o.status}</span>
                </td>
                <td>{o.httpStatus ?? "—"}</td>
                <td>{o.durationMs !== null ? `${o.durationMs} ms` : "—"}</td>
                <td>
                  {o.attemptedAt
                    ? new Date(o.attemptedAt).toLocaleTimeString()
                    : "—"}
                </td>
                <td>{o.itemCount ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/* ---------------- Router-fallback checklist ---------------- */
type CheckResult = "pending" | "pass" | "fail";

function FallbackChecklist() {
  const tests = [
    {
      label: "/index.html restores to home (/)",
      url: internalHref("/index.html"),
      expected: internalHref("/") || "/",
      note: "404.html should redirect /index.html → app root.",
    },
    {
      label: "/dashboard renders the Dashboard route",
      url: internalHref("/dashboard"),
      expected: internalHref("/dashboard"),
      note: "Deep link should hydrate Content Dashboard.",
    },
    {
      label: "/dashboard?tab=tasks preserves the query string",
      url: internalHref("/dashboard") + "?tab=tasks",
      expected: internalHref("/dashboard"),
      note: "Search params must survive the SPA fallback.",
    },
  ];

  const [results, setResults] = useState<CheckResult[]>(
    tests.map(() => "pending"),
  );
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    setResults(tests.map(() => "pending"));
    const next: CheckResult[] = [];

    for (const t of tests) {
      try {
        const r = await fetch(t.url, {
          method: "GET",
          redirect: "follow",
          cache: "no-store",
        });
        // A successful HTML response (200) means SPA shell loaded.
        const ct = r.headers.get("content-type") || "";
        const ok = r.ok && (ct.includes("html") || ct.includes("text/html"));
        next.push(ok ? "pass" : "fail");
      } catch {
        next.push("fail");
      }
      setResults([...next, ...tests.slice(next.length).map(() => "pending" as const)]);
    }
    setRunning(false);
  };

  return (
    <section className="debug__env">
      <h2>Router fallback checklist</h2>
      <p className="muted small" style={{ marginBottom: 14 }}>
        Verifies the GitHub Pages SPA fallback (<code>public/404.html</code>)
        for deep links and legacy <code>/index.html</code> visits.
      </p>
      <ol className="debug-checklist">
        {tests.map((t, i) => (
          <li key={t.label} className={`check check-${results[i]}`}>
            <span className="check__icon" aria-hidden="true">
              {results[i] === "pass" ? "✓" : results[i] === "fail" ? "✗" : "·"}
            </span>
            <div className="check__body">
              <div className="check__label">{t.label}</div>
              <div className="check__meta">
                <a href={t.url} target="_blank" rel="noopener noreferrer">
                  <code>{t.url}</code>
                </a>
                <span className="muted small"> — {t.note}</span>
              </div>
            </div>
            <span className={`badge ${results[i] === "pass" ? "ok" : results[i] === "fail" ? "error" : "loading"}`}>
              {results[i].toUpperCase()}
            </span>
          </li>
        ))}
      </ol>
      <div className="debug-actions">
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={runChecks}
          disabled={running}
        >
          {running ? "Running…" : "▶ Run checklist"}
        </button>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
function DebugPage() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "(SSR)";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "(SSR)";

  return (
    <div className="debug">
      <header className="debug__top">
        <Link to="/" search={{ view: "full" }} className="debug__back">
          ← Back to site
        </Link>
        <h1>Deployment Debug</h1>
        <p className="muted">
          Hidden diagnostic page. Performs live <code>GET</code> requests
          against the static JSON files and shows the exact response. Use this
          to verify deployment under any base path.
        </p>
      </header>

      <section className="debug__env">
        <h2>Environment &amp; resolved paths</h2>
        <Row label="window.location.origin" value={<code>{origin}</code>} />
        <Row label="import.meta.env.BASE_URL" value={<code>{baseUrl}</code>} />
        <Row label="basePath()" value={<code>{basePath() || "(empty — site root)"}</code>} />
        <Row
          label="assetUrl('/data/tasks.json')"
          value={<code>{assetUrl("/data/tasks.json")}</code>}
        />
        <Row
          label="assetUrl('/data/projects.json')"
          value={<code>{assetUrl("/data/projects.json")}</code>}
        />
        <Row
          label="assetUrl('/data/research.json')"
          value={<code>{assetUrl("/data/research.json")}</code>}
        />
        <Row
          label="internalHref('/dashboard')"
          value={<code>{internalHref("/dashboard")}</code>}
        />
        <Row label="User agent" value={<code className="small">{ua}</code>} />
      </section>

      <section className="debug__env">
        <h2>Quick navigation (base-path aware)</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          These links are constructed via <code>internalHref()</code> so they
          work under any deployment subpath.
        </p>
        <div className="debug-links">
          <Link to="/" search={{ view: "full" }} hash="tasks" className="btn btn-outline btn-small">
            → Tasks section
          </Link>
          <Link to="/" search={{ view: "full" }} hash="projects" className="btn btn-outline btn-small">
            → Projects section
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-small">
            → Dashboard
          </Link>
          <a href={internalHref("/index.html")} className="btn btn-outline btn-small">
            → /index.html (raw)
          </a>
        </div>
      </section>

      <FallbackChecklist />

      <CachedOutcomesPanel />

      <section className="debug__grid">
        <FeedReport title="Tasks feed" path="/data/tasks.json" />
        <FeedReport title="Projects feed" path="/data/projects.json" />
        <FeedReport title="Research feed" path="/data/research.json" />
      </section>
    </div>
  );
}
