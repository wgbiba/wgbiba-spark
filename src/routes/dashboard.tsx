import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "@/lib/data";
import {
  addQA,
  clearAllOverrides,
  deleteQA,
  editQA,
  getOverrideStats,
  resetQA,
  restoreQA,
  useKBOverrides,
  useMergedCategories,
} from "@/lib/kb-overrides";
import { KB_CATEGORIES, type Category, type QA, type Topic } from "@/lib/knowledge";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Content Dashboard – WGBIBA" },
      {
        name: "description",
        content:
          "Pseudo-admin dashboard for WGBIBA: generate JSON snippets for new tasks and projects to paste into the GitHub repo. No data is stored.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Content Dashboard – WGBIBA" },
      {
        property: "og:description",
        content:
          "Generate JSON for new tasks and projects to paste into the GitHub repo.",
      },
    ],
  }),
  component: DashboardPage,
});

/* ---------------- Types ---------------- */
type TaskLink = { label: string; url: string };
type Task = {
  title: string;
  description?: string;
  tag?: string;
  date?: string;
  links?: TaskLink[];
};
type Project = {
  title: string;
  description?: string;
  stack?: string[];
  github?: string;
  demo?: string;
};
type Research = {
  title: string;
  abstract?: string;
  type?: string;
  year?: string;
  link?: string;
};
const DASHBOARD_PASSWORD = "1234";
const DASHBOARD_AUTH_KEY = "wgbiba.dashboard-auth";

function DashboardGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(DASHBOARD_AUTH_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === DASHBOARD_PASSWORD) {
      try {
        sessionStorage.setItem(DASHBOARD_AUTH_KEY, "1");
      } catch {
        // ignore
      }
      setUnlocked(true);
      setError(null);
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <main
      id="main"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={onSubmit}
        className="form"
        aria-label="Dashboard password"
        style={{
          maxWidth: 360,
          width: "100%",
          padding: 24,
          border: "1px solid var(--c-border)",
          borderRadius: 12,
          background: "#fff",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "1.2rem" }}>Dashboard locked 🔒</h1>
        <p className="muted small" style={{ marginTop: 0 }}>
          Enter the password to access the Content Dashboard.
        </p>
        <div className="field">
          <label htmlFor="dash-pw">Password</label>
          <input
            id="dash-pw"
            type="password"
            value={pw}
            autoFocus
            onChange={(e) => {
              setPw(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••"
          />
        </div>
        {error && (
          <p className="kb-chat-error" role="alert" style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
        <div className="form-actions" style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary">
            Unlock
          </button>
          <Link to="/" search={{ view: "full" }} className="btn btn-outline">
            ← Back to home
          </Link>
        </div>
      </form>
    </main>
  );
}

function DashboardPage() {
  return (
    <DashboardGate>
      <DashboardPageInner />
    </DashboardGate>
  );
}

function DashboardPageInner() {
  const [activeTab, setActiveTab] = useState<
    "task" | "project" | "research" | "knowledge"
  >("task");

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* NAVBAR */}
      <header className="navbar scrolled" role="banner">
        <div className="container nav-inner">
          <Link
            to="/"
            search={{ view: "full" }}
            className="brand"
            aria-label="WGBIBA — go to home"
          >
            <span className="brand-mark" aria-hidden="true">WG</span>
            <span className="brand-text">BIBA</span>
            <span className="brand-tag" aria-hidden="true">/admin</span>
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link to="/" search={{ view: "full" }}>
              <span className="nav-num" aria-hidden="true">←</span>
              <span>Home</span>
            </Link>
            <Link to="/" search={{ view: "full" }} hash="tasks">
              <span className="nav-num" aria-hidden="true">02</span>
              <span>Tasks</span>
            </Link>
            <Link to="/" search={{ view: "full" }} hash="projects">
              <span className="nav-num" aria-hidden="true">03</span>
              <span>Projects</span>
            </Link>
            <Link to="/dashboard" activeProps={{ className: "active" }}>
              <span className="nav-num" aria-hidden="true">05</span>
              <span>Dashboard</span>
            </Link>
            <a
              href="https://github.com/wgbiba"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-cta"
              aria-label="WGBIBA on GitHub (opens in new tab)"
            >
              <span aria-hidden="true">↗</span>&nbsp;GitHub
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section
          id="dashboard"
          className="section"
          aria-labelledby="dashboard-title"
          style={{ paddingTop: "120px" }}
        >
          <div className="container">
            <div className="section-head">
              <span className="kicker">Pseudo Admin</span>
              <h1 id="dashboard-title">Content Dashboard</h1>
              <p className="muted">
                Generate JSON snippets for new tasks and projects. Nothing is
                stored — copy the output and paste it into the corresponding
                file in the GitHub repo.
              </p>
            </div>

            <div className="dash-instructions">
              <strong>How it works</strong>
              <ol>
                <li>Fill in the form below.</li>
                <li>
                  Click <em>Generate JSON</em> and review the live preview.
                </li>
                <li>
                  Copy the JSON and paste it into{" "}
                  <code>public/data/tasks.json</code> or{" "}
                  <code>public/data/projects.json</code> on GitHub.
                </li>
              </ol>
              <div className="dash-actions">
                <a
                  className="btn btn-outline btn-small"
                  href="https://github.com/wgbiba/wgbiba/edit/main/public/data/tasks.json"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✎ Edit tasks.json on GitHub
                </a>
                <a
                  className="btn btn-outline btn-small"
                  href="https://github.com/wgbiba/wgbiba/edit/main/public/data/projects.json"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✎ Edit projects.json on GitHub
                </a>
                <a
                  className="btn btn-outline btn-small"
                  href="https://github.com/wgbiba/wgbiba/edit/main/public/data/research.json"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✎ Edit research.json on GitHub
                </a>
              </div>
            </div>

            <div
              className="dash-tabs"
              role="tablist"
              aria-label="Dashboard sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "task"}
                aria-controls="panel-task"
                id="tab-task"
                className={`tab${activeTab === "task" ? " active" : ""}`}
                onClick={() => setActiveTab("task")}
              >
                Add Task
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "project"}
                aria-controls="panel-project"
                id="tab-project"
                className={`tab${activeTab === "project" ? " active" : ""}`}
                onClick={() => setActiveTab("project")}
              >
                Add Project
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "research"}
                aria-controls="panel-research"
                id="tab-research"
                className={`tab${activeTab === "research" ? " active" : ""}`}
                onClick={() => setActiveTab("research")}
              >
                Add Research
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "knowledge"}
                aria-controls="panel-knowledge"
                id="tab-knowledge"
                className={`tab${activeTab === "knowledge" ? " active" : ""}`}
                onClick={() => setActiveTab("knowledge")}
              >
                Edit Knowledge Base
              </button>
            </div>

            {activeTab === "task" && <TaskDashboard />}
            {activeTab === "project" && <ProjectDashboard />}
            {activeTab === "research" &&
              (typeof ResearchDashboard === "function" ? (
                <ResearchDashboard />
              ) : (
                <p className="kb-chat-error">
                  ResearchDashboard component failed to load. Please restart the
                  dev server (see DEV-CHECKLIST.md).
                </p>
              ))}
            {activeTab === "knowledge" && <KnowledgeDashboard />}
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container foot-bottom">
          <p className="small muted">
            © {new Date().getFullYear()} WGBIBA · BTU Cottbus–Senftenberg.
          </p>
        </div>
      </footer>
    </>
  );
}

/* ---------------- Card previews ---------------- */
function TaskCard({ task }: { task: Task }) {
  return (
    <article className="card" aria-label={task.title || "Task"}>
      <div className="meta">
        {task.tag && <span className="tag">{task.tag}</span>}
        {task.date && <span>{task.date}</span>}
      </div>
      <h3>{task.title || "Untitled task"}</h3>
      <p className="muted small">{task.description || ""}</p>
      {task.links && task.links.length > 0 && (
        <div className="card-links">
          {task.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.label} →
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card" aria-label={project.title || "Project"}>
      <h3>{project.title || "Untitled project"}</h3>
      <p className="muted small">{project.description || ""}</p>
      {project.stack && project.stack.length > 0 && (
        <div className="meta" aria-label="Tech stack">
          {project.stack.map((s, i) => (
            <span key={i} className="tag">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="card-links">
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer">
            GitHub →
          </a>
        )}
        {project.demo && (
          <a href={project.demo} target="_blank" rel="noopener noreferrer">
            Demo →
          </a>
        )}
      </div>
    </article>
  );
}

/* ---------------- Helpers ---------------- */
function parseLinks(text: string): TaskLink[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((s) => (s || "").trim());
      return { label: label || "Link", url: url || "#" };
    });
}

function CopyButton({
  getText,
  label,
}: {
  getText: () => string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy failed — please copy manually.");
    }
  };
  return (
    <button
      type="button"
      className="btn btn-small"
      onClick={onClick}
      aria-label={`Copy ${label} to clipboard`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* ---------------- Task Dashboard ---------------- */
function TaskDashboard() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    tag: "",
    date: "",
    links: "",
  });
  const [json, setJson] = useState<string>("// JSON will appear here");
  const jsonRef = useRef<string>("// JSON will appear here");
  jsonRef.current = json;

  const taskObj: Task = useMemo(
    () => ({
      title: form.title,
      description: form.description,
      tag: form.tag,
      date: form.date,
      links: parseLinks(form.links),
    }),
    [form],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJson(JSON.stringify(taskObj, null, 2));
  };

  const handleReset = () =>
    setForm({ title: "", description: "", tag: "", date: "", links: "" });

  return (
    <div
      className="dash-panel active"
      id="panel-task"
      role="tabpanel"
      aria-labelledby="tab-task"
    >
      <div className="dash-grid">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="New task form"
        >
          <div className="field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Sixth Assignment – ..."
              required
            />
          </div>
          <div className="field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Short summary of the task..."
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="task-tag">Course / Tag</label>
              <input
                id="task-tag"
                name="tag"
                value={form.tag}
                onChange={handleChange}
                placeholder="Optimization"
              />
            </div>
            <div className="field">
              <label htmlFor="task-date">Date</label>
              <input
                id="task-date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="task-links">
              Links (one per line, format: <code>Label | https://url</code>)
            </label>
            <textarea
              id="task-links"
              name="links"
              rows={3}
              value={form.links}
              onChange={handleChange}
              placeholder={
                "Task PDF | https://example.com/task.pdf\nSolution | https://github.com/..."
              }
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="dash-preview">
          <div>
            <h4>Live Preview</h4>
            <div className="preview-area">
              {taskObj.title ? (
                <TaskCard task={taskObj} />
              ) : (
                <p className="muted small">
                  Fill in the form to preview the task card.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="json-head">
              <h4>Generated JSON</h4>
              <CopyButton
                getText={() => jsonRef.current}
                label="task JSON"
              />
            </div>
            <pre
              className="code-block"
              aria-label="Generated task JSON"
            >
              <code>{json}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Project Dashboard ---------------- */
function ProjectDashboard() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    stack: "",
    github: "",
    demo: "",
  });
  const [json, setJson] = useState<string>("// JSON will appear here");
  const jsonRef = useRef<string>("// JSON will appear here");
  jsonRef.current = json;

  const projectObj: Project = useMemo(
    () => ({
      title: form.title,
      description: form.description,
      stack: form.stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      github: form.github,
      demo: form.demo,
    }),
    [form],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJson(JSON.stringify(projectObj, null, 2));
  };

  const handleReset = () =>
    setForm({ title: "", description: "", stack: "", github: "", demo: "" });

  return (
    <div
      className="dash-panel active"
      id="panel-project"
      role="tabpanel"
      aria-labelledby="tab-project"
    >
      <div className="dash-grid">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="New project form"
        >
          <div className="field">
            <label htmlFor="proj-title">Title</label>
            <input
              id="proj-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Optimization Toolkit"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="proj-description">Description</label>
            <textarea
              id="proj-description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="What does the project do?"
            />
          </div>
          <div className="field">
            <label htmlFor="proj-stack">Tech Stack (comma separated)</label>
            <input
              id="proj-stack"
              name="stack"
              value={form.stack}
              onChange={handleChange}
              placeholder="Python, FastAPI, React"
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="proj-github">GitHub Link</label>
              <input
                id="proj-github"
                type="url"
                name="github"
                value={form.github}
                onChange={handleChange}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="field">
              <label htmlFor="proj-demo">Demo Link (optional)</label>
              <input
                id="proj-demo"
                type="url"
                name="demo"
                value={form.demo}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="dash-preview">
          <div>
            <h4>Live Preview</h4>
            <div className="preview-area">
              {projectObj.title ? (
                <ProjectCard project={projectObj} />
              ) : (
                <p className="muted small">
                  Fill in the form to preview the project card.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="json-head">
              <h4>Generated JSON</h4>
              <CopyButton
                getText={() => jsonRef.current}
                label="project JSON"
              />
            </div>
            <pre
              className="code-block"
              aria-label="Generated project JSON"
            >
              <code>{json}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Research card ---------------- */
function ResearchCard({ research }: { research: Research }) {
  return (
    <article className="card" aria-label={research.title || "Research"}>
      <div className="meta">
        {research.type && <span className="tag">{research.type}</span>}
        {research.year && <span>{research.year}</span>}
      </div>
      <h3>{research.title || "Untitled research"}</h3>
      <p className="muted small">{research.abstract || ""}</p>
      {research.link && (
        <div className="card-links">
          <a href={research.link} target="_blank" rel="noopener noreferrer">
            View paper →
          </a>
        </div>
      )}
    </article>
  );
}

/* ---------------- Research Dashboard ---------------- */
function ResearchDashboard() {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    type: "",
    year: "",
    link: "",
  });
  const [json, setJson] = useState<string>("// JSON will appear here");
  const jsonRef = useRef<string>("// JSON will appear here");
  jsonRef.current = json;

  // Dev probe: log the research data source so it's obvious whether the
  // Research tab is wired to the expected /data/research.json file.
  useEffect(() => {
    const url = assetUrl("/data/research.json");
    // eslint-disable-next-line no-console
    console.info("[ResearchDashboard] mounted — data source:", url);
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        let count: number | string = "n/a";
        if (r.ok && ct.includes("json")) {
          try {
            const parsed = (await r.json()) as unknown;
            count = Array.isArray(parsed) ? parsed.length : "not-array";
          } catch {
            count = "parse-error";
          }
        }
        // eslint-disable-next-line no-console
        console.info(
          `[ResearchDashboard] fetch ${url} — status=${r.status} content-type="${ct}" items=${count}`,
        );
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(`[ResearchDashboard] fetch ${url} failed:`, e);
      });
  }, []);

  const researchObj: Research = useMemo(
    () => ({
      title: form.title,
      abstract: form.abstract,
      type: form.type,
      year: form.year,
      link: form.link,
    }),
    [form],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJson(JSON.stringify(researchObj, null, 2));
  };

  const handleReset = () =>
    setForm({ title: "", abstract: "", type: "", year: "", link: "" });

  return (
    <div
      className="dash-panel active"
      id="panel-research"
      role="tabpanel"
      aria-labelledby="tab-research"
    >
      <div className="dash-grid">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="New research form"
        >
          <div className="field">
            <label htmlFor="res-title">Title</label>
            <input
              id="res-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Paper title"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="res-abstract">Abstract</label>
            <textarea
              id="res-abstract"
              name="abstract"
              rows={4}
              value={form.abstract}
              onChange={handleChange}
              placeholder="Brief summary of the research question, methodology, and key findings..."
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="res-type">Type</label>
              <input
                id="res-type"
                name="type"
                value={form.type}
                onChange={handleChange}
                placeholder="Journal Paper / Conference / Thesis"
              />
            </div>
            <div className="field">
              <label htmlFor="res-year">Year</label>
              <input
                id="res-year"
                name="year"
                value={form.year}
                onChange={handleChange}
                placeholder="2025"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="res-link">Link</label>
            <input
              id="res-link"
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="https://example.com/your-paper"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="dash-preview">
          <div>
            <h4>Live Preview</h4>
            <div className="preview-area">
              {researchObj.title ? (
                <ResearchCard research={researchObj} />
              ) : (
                <p className="muted small">
                  Fill in the form to preview the research card.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="json-head">
              <h4>Generated JSON</h4>
              <CopyButton
                getText={() => jsonRef.current}
                label="research JSON"
              />
            </div>
            <pre
              className="code-block"
              aria-label="Generated research JSON"
            >
              <code>{json}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   Knowledge Base editor — add / edit / delete Q&A entries
   Edits persist in localStorage and are merged into the public KB.
   ==================================================================== */


type DraftMode =
  | { kind: "idle" }
  | { kind: "new" }
  | { kind: "edit"; qaId: string };

function KnowledgeDashboard() {
  const merged = useMergedCategories();
  const overrides = useKBOverrides();
  const categories: Category[] = merged.length > 0 ? merged : KB_CATEGORIES;

  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const activeCategory: Category =
    categories.find((c) => c.id === categoryId) ?? categories[0];

  const [topicId, setTopicId] = useState<string>(
    activeCategory?.topics[0]?.id ?? "",
  );
  // If the chosen topic doesn't exist in the new category, snap to the first one.
  useEffect(() => {
    if (!activeCategory) return;
    if (!activeCategory.topics.some((t) => t.id === topicId)) {
      setTopicId(activeCategory.topics[0]?.id ?? "");
    }
  }, [activeCategory, topicId]);

  const activeTopic: Topic | undefined = activeCategory?.topics.find(
    (t) => t.id === topicId,
  );

  // Identify which QAs in this topic are user-touched (edited / added / deleted).
  const isAdded = (qaId: string): boolean => {
    const key = `${categoryId}/${topicId}`;
    return (overrides.adds[key] ?? []).some((qa) => qa.id === qaId);
  };
  const isEdited = (qaId: string): boolean =>
    `${categoryId}/${topicId}/${qaId}` in overrides.edits;
  const deletedFullIds = useMemo(
    () => new Set(overrides.deletes),
    [overrides.deletes],
  );
  const deletedHere = useMemo(() => {
    if (!activeTopic) return [] as QA[];
    const baseline = KB_CATEGORIES.find((c) => c.id === categoryId)
      ?.topics.find((t) => t.id === topicId);
    if (!baseline) return [];
    return baseline.qa.filter((qa) =>
      deletedFullIds.has(`${categoryId}/${topicId}/${qa.id}`),
    );
  }, [activeTopic, categoryId, topicId, deletedFullIds]);

  const [mode, setMode] = useState<DraftMode>({ kind: "idle" });
  const [draft, setDraft] = useState({ question: "", answer: "", deepDive: "" });
  const [flash, setFlash] = useState<string | null>(null);

  const flashMsg = (text: string) => {
    setFlash(text);
    window.clearTimeout((flashMsg as unknown as { _t?: number })._t);
    (flashMsg as unknown as { _t?: number })._t = window.setTimeout(
      () => setFlash(null),
      2200,
    );
  };

  const startNew = () => {
    setMode({ kind: "new" });
    setDraft({ question: "", answer: "", deepDive: "" });
  };

  const startEdit = (qa: QA) => {
    setMode({ kind: "edit", qaId: qa.id });
    setDraft({
      question: qa.question,
      answer: qa.answer,
      deepDive: qa.deepDive ?? "",
    });
  };

  const cancel = () => {
    setMode({ kind: "idle" });
    setDraft({ question: "", answer: "", deepDive: "" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    if (!question || !answer) {
      flashMsg("Question and answer are both required.");
      return;
    }
    if (mode.kind === "new") {
      addQA(categoryId, topicId, {
        question,
        answer,
        deepDive: draft.deepDive.trim() || undefined,
      });
      flashMsg("Added.");
    } else if (mode.kind === "edit") {
      editQA(categoryId, topicId, mode.qaId, {
        question,
        answer,
        deepDive: draft.deepDive.trim(),
      });
      flashMsg("Saved.");
    }
    cancel();
  };

  const stats = getOverrideStats();

  return (
    <div
      className="dash-panel active"
      id="panel-knowledge"
      role="tabpanel"
      aria-labelledby="tab-knowledge"
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <p className="muted small" style={{ margin: 0 }}>
            Edit, add, or delete questions in any topic. Changes are saved in
            this browser only and merged on top of the built-in knowledge base
            in real time.
          </p>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            <strong>{stats.added}</strong> added · <strong>{stats.edited}</strong>{" "}
            edited · <strong>{stats.deleted}</strong> deleted
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            to="/knowledge"
            search={{ cat: categoryId, topic: topicId }}
            className="btn btn-outline btn-small"
          >
            ↗ Open in KB
          </Link>
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={() => {
              if (
                window.confirm(
                  "Reset ALL knowledge-base edits in this browser? The built-in content will be restored.",
                )
              ) {
                clearAllOverrides();
                cancel();
                flashMsg("All edits cleared.");
              }
            }}
            disabled={stats.added + stats.edited + stats.deleted === 0}
          >
            Reset all edits
          </button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 18 }}>
        <div className="field">
          <label htmlFor="kbed-cat">Category</label>
          <select
            id="kbed-cat"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              cancel();
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="kbed-topic">Topic</label>
          <select
            id="kbed-topic"
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value);
              cancel();
            }}
          >
            {(activeCategory?.topics ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {flash && (
        <p
          role="status"
          style={{
            background: "var(--c-accent-soft, #eef2ff)",
            color: "var(--c-accent, #2563eb)",
            padding: "8px 12px",
            borderRadius: 8,
            margin: "0 0 14px",
            fontSize: ".9rem",
          }}
        >
          {flash}
        </p>
      )}

      {/* Editor / new form */}
      {mode.kind !== "idle" ? (
        <form
          className="form"
          onSubmit={submit}
          aria-label={mode.kind === "new" ? "Add a Q&A" : "Edit Q&A"}
          style={{ marginBottom: 22 }}
        >
          <div className="field">
            <label htmlFor="kbed-q">Question</label>
            <input
              id="kbed-q"
              type="text"
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
              maxLength={300}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="kbed-a">Answer (HTML allowed)</label>
            <textarea
              id="kbed-a"
              rows={8}
              value={draft.answer}
              onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
              required
              placeholder="<p>You can use simple HTML — paragraphs, <strong>bold</strong>, lists, etc.</p>"
            />
          </div>
          <div className="field">
            <label htmlFor="kbed-d">Deep dive (optional)</label>
            <textarea
              id="kbed-d"
              rows={3}
              value={draft.deepDive}
              onChange={(e) => setDraft((d) => ({ ...d, deepDive: e.target.value }))}
              placeholder="Optional extra context shown in the “Deep dive” callout."
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {mode.kind === "new" ? "Add question" : "Save changes"}
            </button>
            <button type="button" className="btn btn-outline" onClick={cancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={startNew}
          style={{ marginBottom: 18 }}
          disabled={!activeTopic}
        >
          + Add new question
        </button>
      )}

      {/* Existing Q&A list */}
      {activeTopic && (
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {activeTopic.qa.map((qa) => {
            const editing =
              mode.kind === "edit" && mode.qaId === qa.id ? true : false;
            const added = isAdded(qa.id);
            const edited = isEdited(qa.id);
            return (
              <li
                key={qa.id}
                style={{
                  border: "1px solid var(--c-border, #e5e7eb)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: editing ? "var(--c-accent-soft, #eef2ff)" : "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 280px" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                      {qa.question}
                    </p>
                    <p
                      className="muted small"
                      style={{
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {qa.answer.replace(/<[^>]+>/g, "").slice(0, 200)}
                    </p>
                    <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {added && <span className="tag">added</span>}
                      {edited && <span className="tag">edited</span>}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexShrink: 0,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => startEdit(qa)}
                    >
                      Edit
                    </button>
                    {edited && (
                      <button
                        type="button"
                        className="btn btn-outline btn-small"
                        onClick={() => {
                          resetQA(categoryId, topicId, qa.id);
                          flashMsg("Reverted to original.");
                        }}
                      >
                        Revert
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-small"
                      style={{ color: "#b91c1c", borderColor: "#fecaca" }}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete the question:\n\n“${qa.question}”\n\nYou can restore it later from the deleted list below.`,
                          )
                        ) {
                          deleteQA(categoryId, topicId, qa.id);
                          if (mode.kind === "edit" && mode.qaId === qa.id) cancel();
                          flashMsg("Deleted.");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Restorable deletions */}
      {deletedHere.length > 0 && (
        <details style={{ marginTop: 22 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Deleted questions in this topic ({deletedHere.length})
          </summary>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
            {deletedHere.map((qa) => (
              <li
                key={qa.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  border: "1px dashed var(--c-border, #e5e7eb)",
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              >
                <span className="muted small" style={{ flex: 1 }}>
                  {qa.question}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={() => {
                    restoreQA(categoryId, topicId, qa.id);
                    flashMsg("Restored.");
                  }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
