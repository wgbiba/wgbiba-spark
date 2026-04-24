import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KB_CATEGORIES, flattenQAs, type QA, type Topic, type Category } from "@/lib/knowledge";

const FEEDBACK_KEY = "kb:feedback:v1";

type Vote = "up" | "down";
type FeedbackMap = Record<string, Vote>;

type SearchSchema = {
  /** URL-encoded snapshot of someone else's feedback */
  s?: string;
};

export const Route = createFileRoute("/knowledge-feedback")({
  validateSearch: (search: Record<string, unknown>): SearchSchema => ({
    s: typeof search.s === "string" ? search.s : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My feedback — Knowledge Base | WGBIBA" },
      {
        name: "description",
        content:
          "A summary of your thumbs up / thumbs down votes across the optimization knowledge base, grouped by topic, with a shareable URL snapshot.",
      },
      { property: "og:title", content: "My feedback — Knowledge Base" },
      {
        property: "og:description",
        content: "Summary of helpful / not-helpful votes by topic, with a shareable snapshot link.",
      },
    ],
  }),
  component: FeedbackPage,
});

// ----- snapshot encoding -----
// We URL-encode the feedback map as base64-of-JSON. Keys are full IDs
// "category/topic/qa", values are "u" | "d" to keep the URL short.
function encodeSnapshot(map: FeedbackMap): string {
  const compact: Record<string, "u" | "d"> = {};
  for (const [k, v] of Object.entries(map)) compact[k] = v === "up" ? "u" : "d";
  const json = JSON.stringify(compact);
  // btoa needs ASCII; our IDs are ASCII so this is safe
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeSnapshot(s: string): FeedbackMap | null {
  try {
    const json = decodeURIComponent(escape(atob(s)));
    const compact = JSON.parse(json) as Record<string, string>;
    const out: FeedbackMap = {};
    for (const [k, v] of Object.entries(compact)) {
      if (v === "u") out[k] = "up";
      else if (v === "d") out[k] = "down";
    }
    return out;
  } catch {
    return null;
  }
}

function FeedbackPage() {
  const { s } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [localMap, setLocalMap] = useState<FeedbackMap>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FEEDBACK_KEY);
      if (raw) setLocalMap(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const sharedMap = useMemo(() => (s ? decodeSnapshot(s) : null), [s]);
  const isShared = !!sharedMap;
  const map: FeedbackMap = sharedMap ?? localMap;

  const flat = useMemo(() => flattenQAs(), []);

  // Group votes by topic
  type TopicGroup = {
    category: Category;
    topic: Topic;
    items: Array<{ qa: QA; vote: Vote }>;
    up: number;
    down: number;
  };
  const groups = useMemo<TopicGroup[]>(() => {
    const byTopic = new Map<string, TopicGroup>();
    for (const { category, topic, qa, fullId } of flat) {
      const v = map[fullId];
      if (!v) continue;
      const key = `${category.id}/${topic.id}`;
      let g = byTopic.get(key);
      if (!g) {
        g = { category, topic, items: [], up: 0, down: 0 };
        byTopic.set(key, g);
      }
      g.items.push({ qa, vote: v });
      if (v === "up") g.up++;
      else g.down++;
    }
    return Array.from(byTopic.values()).sort(
      (a, b) => b.items.length - a.items.length || a.topic.title.localeCompare(b.topic.title),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const totalUp = groups.reduce((n, g) => n + g.up, 0);
  const totalDown = groups.reduce((n, g) => n + g.down, 0);
  const totalVotes = totalUp + totalDown;

  const buildShareUrl = () => {
    const snap = encodeSnapshot(localMap);
    const url = new URL(window.location.href);
    url.searchParams.set("s", snap);
    return url.toString();
  };

  const copyShareLink = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this share link:", url);
    }
  };

  const importSharedToLocal = () => {
    if (!sharedMap) return;
    if (!window.confirm("Replace your own feedback with the shared snapshot?")) return;
    try {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(sharedMap));
      setLocalMap(sharedMap);
      navigate({ search: () => ({}), replace: true });
    } catch {
      alert("Could not save to local storage.");
    }
  };

  const clearShared = () => {
    navigate({ search: () => ({}), replace: true });
  };

  // Coverage: which categories have NO votes yet?
  const coveredCategoryIds = new Set(groups.map((g) => g.category.id));
  const uncoveredCategories = KB_CATEGORIES.filter((c) => !coveredCategoryIds.has(c.id));

  return (
    <div className="kb-shell">
      <header className="kb-header">
        <div className="container kb-header-inner">
          <Link to="/" search={{ view: "full" }} className="kb-brand">
            <span className="brand-mark">WG</span>
            <span>WGBIBA · Feedback summary</span>
          </Link>
          <span />
          <Link to="/knowledge" search={{}} className="kb-back">
            ← Back to knowledge base
          </Link>
        </div>
      </header>

      <div className="container kb-main kb-feedback-main">
        <main className="kb-content">
          <nav aria-label="Breadcrumb" className="kb-crumbs">
            <Link to="/" search={{ view: "full" }}>
              Home
            </Link>
            <span aria-hidden>›</span>
            <Link to="/knowledge" search={{}}>
              Knowledge
            </Link>
            <span aria-hidden>›</span>
            <span aria-current="page">My feedback</span>
          </nav>

          <header className="kb-topic-head">
            <div className="kb-eyebrow">
              {isShared ? "Shared snapshot" : "Your feedback"}
            </div>
            <h1>{isShared ? "Shared feedback summary" : "My feedback summary"}</h1>
            <p className="kb-intro">
              {isShared
                ? "You're viewing a snapshot someone else shared with you, encoded entirely in this URL — nothing was sent to a server."
                : "Every 👍 / 👎 you click on the knowledge base is saved to your browser. Here's the rollup, grouped by topic, plus a shareable URL snapshot you can send to a teammate."}
            </p>
          </header>

          {/* Stats card */}
          <div className="kb-fb-stats">
            <div className="kb-fb-stat">
              <div className="kb-fb-stat-num">{totalVotes}</div>
              <div className="kb-fb-stat-label">Total votes</div>
            </div>
            <div className="kb-fb-stat">
              <div className="kb-fb-stat-num kb-fb-up">👍 {totalUp}</div>
              <div className="kb-fb-stat-label">Helpful</div>
            </div>
            <div className="kb-fb-stat">
              <div className="kb-fb-stat-num kb-fb-down">👎 {totalDown}</div>
              <div className="kb-fb-stat-label">Not helpful</div>
            </div>
            <div className="kb-fb-stat">
              <div className="kb-fb-stat-num">{groups.length}</div>
              <div className="kb-fb-stat-label">Topics rated</div>
            </div>
          </div>

          {/* Action bar */}
          <div className="kb-fb-actionbar">
            {!isShared && totalVotes > 0 && (
              <button type="button" className="btn btn-primary" onClick={copyShareLink}>
                {copied ? "✓ Link copied" : "🔗 Copy shareable link"}
              </button>
            )}
            {isShared && (
              <>
                <button type="button" className="btn btn-primary" onClick={importSharedToLocal}>
                  Import to my browser
                </button>
                <button type="button" className="btn btn-outline" onClick={clearShared}>
                  Show my own feedback
                </button>
              </>
            )}
          </div>

          {totalVotes === 0 ? (
            <div className="kb-fb-empty">
              <p>
                {isShared
                  ? "This snapshot doesn't contain any votes."
                  : "You haven't voted on any answers yet — head to the knowledge base and tap 👍 or 👎."}
              </p>
              <Link to="/knowledge" search={{}} className="btn btn-primary">
                Open knowledge base
              </Link>
            </div>
          ) : (
            <>
              {/* Per-topic groups */}
              <section className="kb-fb-groups">
                {groups.map((g) => {
                  const total = g.up + g.down;
                  const upPct = total ? Math.round((g.up / total) * 100) : 0;
                  return (
                    <article key={`${g.category.id}/${g.topic.id}`} className="kb-fb-group">
                      <header className="kb-fb-group-head">
                        <div>
                          <div className="kb-fb-group-cat">{g.category.title}</div>
                          <h3>
                            <Link
                              to="/knowledge"
                              search={{ cat: g.category.id, topic: g.topic.id }}
                            >
                              {g.topic.title}
                            </Link>
                          </h3>
                        </div>
                        <div className="kb-fb-group-counts">
                          <span className="kb-fb-up">👍 {g.up}</span>
                          <span className="kb-fb-down">👎 {g.down}</span>
                        </div>
                      </header>

                      <div className="kb-fb-bar" aria-label={`${upPct}% helpful`}>
                        <div className="kb-fb-bar-up" style={{ width: `${upPct}%` }} />
                      </div>

                      <ul className="kb-fb-items">
                        {g.items.map(({ qa, vote }) => (
                          <li key={qa.id} className="kb-fb-item">
                            <span className={`kb-fb-pill kb-fb-${vote}`}>
                              {vote === "up" ? "👍" : "👎"}
                            </span>
                            <Link
                              to="/knowledge"
                              search={{ cat: g.category.id, topic: g.topic.id }}
                              hash={qa.id}
                            >
                              {qa.question}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </section>

              {uncoveredCategories.length > 0 && !isShared && (
                <section className="kb-fb-uncovered">
                  <h3>Categories you haven't rated yet</h3>
                  <ul>
                    {uncoveredCategories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to="/knowledge"
                          search={{ cat: c.id, topic: c.topics[0].id }}
                        >
                          {c.icon} {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="kb-footer">
        <div className="container">
          <p className="muted small">
            Snapshots are encoded directly in the URL — no account, no tracking, no backend.
          </p>
        </div>
      </footer>
    </div>
  );
}
